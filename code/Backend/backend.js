// backend.js
// khởi chạy mosquitto:  mosquitto -v -c "C:\\Program Files\\mosquitto\\mosquitto.conf"

import express from "express";
import mqtt from "mqtt";
import cors from "cors";
import bodyParser from "body-parser";
import sql from "mssql";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

/**
 * @apiDefine AuthHeader
 * @apiHeader {String} Authorization Bearer token.
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "Authorization": "Bearer your_token_here"
 *     }
 */

// ✅ Middleware kiểm tra token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]; // Header có dạng: Bearer <token>
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, "SECRET_KEY", (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = decoded; // lưu info vào req để dùng sau
    next();
  });
};

// 🔧 Cấu hình kết nối SQL Server
const dbConfig = {
  user: "sa",
  password: "12345678",
  server: "DESKTOP-6A3BF1G",
  database: "iot_system",
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

// ✅ Tạo pool kết nối
let pool;
(async () => {
  try {
    pool = await sql.connect(dbConfig);
    console.log("✅ Connected to SQL Server");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
})();

// ✅ Kết nối MQTT Broker
const brokerUrl = "mqtt://localhost:1883";
const client = mqtt.connect(brokerUrl, {
  username: "huy",
  password: "123"
});

// Bộ nhớ tạm
let sensorData = {
  temperature: null,
  humidity: null,
  light: null,
  lastUpdate: null
};

let ledState = {
  led1: "OFF",
  led2: "OFF",
  led3: "OFF"
};

let sensorDataTimeout = null;
const SENSOR_TIMEOUT_MS = 6000; 

function resetSensorData() {
  sensorData.temperature = null;
  sensorData.humidity = null;
  sensorData.light = null;
  sensorData.lastUpdate = null;
  ledState
  console.log("⚠️ ESP offline, reset sensor data");
}

client.on("connect", () => {
  console.log("✅ Kết nối MQTT Broker thành công!");
  client.subscribe("iot/sensor/data");
  client.subscribe("iot/led/state");
});

// 📥 Nhận dữ liệu từ ESP
client.on("message", async (topic, message) => {
  if (topic === "iot/sensor/data") {
    const data = JSON.parse(message.toString());
    sensorData.temperature = data.temperature;
    sensorData.humidity = data.humidity;
    sensorData.light = data.light;
    sensorData.lastUpdate = new Date().toISOString();
    console.log("📥 Dữ liệu nhận:", sensorData);

    // Vẫn lưu DB nếu bạn muốn có lịch sử
    if (pool?.connected) {
      await pool
        .request()
        .input("temperature", sql.Float, data.temperature)
        .input("humidity", sql.Float, data.humidity)
        .input("light", sql.Int, data.light)
        .query(`
          INSERT INTO sensor_data (temperature, humidity, light)
          VALUES (@temperature, @humidity, @light)
        `);
    }
  }

  // --- LED STATE ---
  if (topic === "iot/led/state") {
    try {
      const data = JSON.parse(message.toString());

      ledState = {
        led1: data.led1,
        led2: data.led2,
        led3: data.led3
      };

      console.log("📥 LED State từ ESP:", ledState);

      // Lưu log DB
      if (pool?.connected) {
        await pool
          .request()
          .input("led1", sql.Bit, data.led1 === "ON" ? 1 : 0)
          .input("led2", sql.Bit, data.led2 === "ON" ? 1 : 0)
          .input("led3", sql.Bit, data.led3 === "ON" ? 1 : 0)
          .input("source", sql.VarChar, "ESP")
          .query(`
            INSERT INTO device_log (led1, led2, led3, source)
            VALUES (@led1, @led2, @led3, @source)
          `);
      }
    } catch (err) {
      console.error("❌ Lỗi parse LED state:", err.message);
    }
  }

  if (sensorDataTimeout) clearTimeout(sensorDataTimeout);
  sensorDataTimeout = setTimeout(resetSensorData, SENSOR_TIMEOUT_MS);
});

/**
 * @api {post} /api/login Login
 * @apiName Login
 * @apiGroup Auth
 *
 * @apiBody {String} username Username.
 * @apiBody {String} password Password.
 *
 * @apiSuccess {String} token JWT token.
 * @apiError 401 Invalid username or password.
 */
// 🔑 Đăng nhập
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  // Ở đây bạn có thể check user/pass từ DB. Demo hardcode:
  if (username === "admin" && password === "123456") {
    const token = jwt.sign({ username: "admin" }, "SECRET_KEY", {
      expiresIn: "1h"
    });
    console.log("✅ Logged in:", username);
    return res.json({ token });
  } else {
    return res.status(401).json({ error: "Sai username hoặc password" });
  }
});

/**
 * @api {get} /api/sensors Get latest sensor data
 * @apiName GetSensor
 * @apiGroup Sensor
 * @apiUse AuthHeader
 *
 * @apiSuccess {Number} temperature Temperature value.
 * @apiSuccess {Number} humidity Humidity value.
 * @apiSuccess {Number} light Light intensity.
 * @apiSuccess {String} lastUpdate Last update timestamp.
 */
// 📡 API - Lấy dữ liệu cảm biến mới nhất (từ bộ nhớ tạm)
app.get("/api/sensors", verifyToken, (req, res) => {
  if (!sensorData.temperature && !sensorData.humidity && !sensorData.light) {
    return res.status(404).json({ error: "No sensor data received yet" });
  }

  res.json({
    temperature: sensorData.temperature,
    humidity: sensorData.humidity,
    light: sensorData.light,
    lastUpdate: sensorData.lastUpdate
  });
});

/**
 * @api {get} /api/sensors/history Get sensor history
 * @apiName GetSensorHistory
 * @apiGroup Sensor
 * @apiUse AuthHeader
 *
 * @apiParam {String} [sortField] Sort field (id, temperature, humidity...).
 * @apiParam {String} [order] asc|desc.
 * @apiParam {String} [searchField] Field to search.
 * @apiParam {String} [searchQuery] Search value.
 *
 * @apiSuccess {Object[]} recordset Array of sensor history data.
 */
// 📜 API - Lịch sử cảm biến (tìm kiếm + sắp xếp)
app.get("/api/sensors/history", verifyToken, async (req, res) => {
  try {
    if (!pool?.connected) {
      return res.status(500).json({ error: "DB not connected" });
    }

    let sortField = req.query.sortField || "id";
    let order = req.query.order || "desc";
    let searchField = req.query.searchField || "all";
    let searchQuery = req.query.searchQuery || "";

    const allowedFields = ["id", "temperature", "humidity", "light", "timestamp"];
    if (!allowedFields.includes(sortField)) sortField = "id";
    if (!["asc", "desc"].includes(order.toLowerCase())) order = "desc";

    let where = "";
    if (searchQuery) {
      if (searchField !== "all" && allowedFields.includes(searchField)) {
        where = `WHERE CAST(${searchField} AS NVARCHAR) LIKE @q`;
      } else {
        where = `
          WHERE 
            CAST(id AS NVARCHAR) LIKE @q OR
            CAST(temperature AS NVARCHAR) LIKE @q OR
            CAST(humidity AS NVARCHAR) LIKE @q OR
            CAST(light AS NVARCHAR) LIKE @q OR
            CONVERT(VARCHAR(19), timestamp, 120) LIKE @q
        `;
      }
    }

    const sqlQuery = `
      SELECT 
        id,
        temperature,
        humidity,
        light,
        FORMAT(timestamp, 'yyyy-MM-dd HH:mm:ss') AS timestamp
      FROM sensor_data
      ${where}
      ORDER BY ${sortField} ${order.toUpperCase()}
    `;

    const result = await pool
      .request()
      .input("q", sql.NVarChar, `%${searchQuery}%`)
      .query(sqlQuery);

    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Lỗi lấy lịch sử sensor_data:", err.message);
    res.status(500).json({ error: "DB query error" });
  }
});

/**
 * @api {get} /api/led Get LED state
 * @apiName GetLED
 * @apiGroup LED
 * @apiUse AuthHeader
 *
 * @apiSuccess {String} led1 State ON|OFF.
 * @apiSuccess {String} led2 State ON|OFF.
 * @apiSuccess {String} led3 State ON|OFF.
 */
// 💡 API - Trạng thái LED hiện tại
app.get("/api/led", verifyToken, (req, res) => {
  res.json(ledState);
});

/**
 * @api {post} /api/led Control LED
 * @apiName ControlLED
 * @apiGroup LED
 * @apiUse AuthHeader
 *
 * @apiBody {String="ON","OFF"} led1 LED1 state.
 * @apiBody {String="ON","OFF"} led2 LED2 state.
 * @apiBody {String="ON","OFF"} led3 LED3 state.
 *
 * @apiSuccess {String} message Response message.
 */
// 💡 API - Điều khiển LED
app.post("/api/led", verifyToken, async (req, res) => {
  const { led1, led2, led3 } = req.body;

  if (
    !["ON", "OFF"].includes(led1) ||
    !["ON", "OFF"].includes(led2) ||
    !["ON", "OFF"].includes(led3)
  ) {
    return res.status(400).json({ error: "Sai tham số! Chỉ dùng ON hoặc OFF." });
  }

  // Gửi lệnh điều khiển xuống ESP
  client.publish(
    "iot/led/control",
    JSON.stringify({ led1, led2, led3 })
  );

  res.json({
    message: "Đã gửi lệnh điều khiển LED, chờ ESP phản hồi"
  });
});

/**
 * @api {get} /api/led/history Get LED change history
 * @apiName GetLEDHistory
 * @apiGroup LED
 * @apiUse AuthHeader
 *
 * @apiParam {String} [search] Search keyword.
 * @apiParam {String} [sortField] Sort field (id, timestamp, source).
 * @apiParam {String} [order] asc|desc.
 *
 * @apiSuccess {Object[]} recordset Array of LED history data.
 */
// 📜 API - Lịch sử thay đổi LED
app.get("/api/led/history", verifyToken, async (req, res) => {
  try {
    if (!pool?.connected) {
      return res.status(500).json({ error: "DB not connected" });
    }

    let search = (req.query.search || "").toLowerCase().trim();
    let sortField = req.query.sortField || "id";
    let order = req.query.order || "desc";

    const allowedFields = ["id", "timestamp", "source"];
    if (!allowedFields.includes(sortField)) sortField = "id";
    if (!["asc", "desc"].includes(order.toLowerCase())) order = "desc";

    const sqlQuery = `
      SELECT
        id,
        led1,
        led2,
        led3,
        source,
        FORMAT(timestamp, 'yyyy-MM-dd HH:mm:ss') AS timestamp
      FROM device_log
      ORDER BY ${sortField} ${order.toUpperCase()}
    `;
    const result = await pool.request().query(sqlQuery);
    const rows = result.recordset;

    const changes = [];
    let prev = null;

    for (const row of rows) {
      if (!prev) {
        prev = row;
        continue;
      }

      if (row.led1 !== prev.led1) {
        changes.push({
          id: row.id,
          timestamp: row.timestamp,
          source: row.source,
          led: "led1",
          state: row.led1 ? "ON" : "OFF",
        });
      }
      if (row.led2 !== prev.led2) {
        changes.push({
          id: row.id,
          timestamp: row.timestamp,
          source: row.source,
          led: "led2",
          state: row.led2 ? "ON" : "OFF",
        });
      }
      if (row.led3 !== prev.led3) {
        changes.push({
          id: row.id,
          timestamp: row.timestamp,
          source: row.source,
          led: "led3",
          state: row.led3 ? "ON" : "OFF",
        });
      }

      prev = row;
    }

    let filteredChanges = changes;
    if (search) {
      filteredChanges = changes.filter(item => {
        const matchId = item.id.toString().includes(search);
        const matchTimestamp = item.timestamp.toLowerCase().includes(search);
        const matchSource = item.source.toLowerCase().includes(search);
        const matchLed = item.led.toLowerCase().includes(search);
        const matchState = item.state.toLowerCase().includes(search);
        return matchId || matchTimestamp || matchSource || matchLed || matchState;
      });
    }

    res.json(filteredChanges);
  } catch (err) {
    console.error("❌ Lỗi lấy device_log:", err.message);
    res.status(500).json({ error: "DB query error" });
  }
});

// 🚀 Khởi chạy server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend chạy tại http://localhost:${PORT}`);
});
