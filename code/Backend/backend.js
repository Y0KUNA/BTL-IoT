// backend.js
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
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  // Header có dạng: Bearer <token>
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
  server: "DESKTOP-O8I245R\\HOTEL",
  database: "iot_system",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
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

// Kết nối MQTT Broker
const brokerUrl = "mqtt://localhost:1883";
const client = mqtt.connect(brokerUrl, {
  username: "huy",
  password: "123",
});

// Bộ nhớ tạm
let sensorData = {
  temperature: null,
  humidity: null,
  light: null,
  lastUpdate: null,
};

let ledState = {
  led1: "OFF",
  led2: "OFF",
  led3: "OFF",
};

client.on("connect", () => {
  console.log("✅ Kết nối MQTT Broker thành công!");
  client.subscribe("iot/sensor/data");
  client.subscribe("iot/led/state");
});

// Nhận dữ liệu cảm biến từ ESP
client.on("message", async (topic, message) => {
  if (topic === "iot/sensor/data") {
    try {
      const data = JSON.parse(message.toString());
      sensorData.temperature = data.temperature;
      sensorData.humidity = data.humidity;
      sensorData.light = data.light;
      sensorData.lastUpdate = new Date().toISOString();

      console.log("📥 Dữ liệu nhận:", sensorData);

      // Lưu DB
      if (pool?.connected) {
        try {
          await pool
            .request()
            .input("temperature", sql.Float, data.temperature)
            .input("humidity", sql.Float, data.humidity)
            .input("light", sql.Int, data.light)
            .query(
              `INSERT INTO sensor_data (temperature, humidity, light)
               VALUES (@temperature, @humidity, @light)`
            );
          console.log("✅ Đã lưu dữ liệu cảm biến vào DB");
        } catch (dbErr) {
          console.error("❌ Lỗi khi insert sensor_data:", dbErr.message);
        }
      }
    } catch (err) {
      console.error("❌ Lỗi parse JSON:", err.message);
    }
  }
  // phản hồi trạng thái LED mới
  if (topic === "iot/led/state") {
    try {
      const data = JSON.parse(message.toString());
      ledState = {
        led1: data.led1,
        led2: data.led2,
        led3: data.led3,
      };
      console.log("📥 LED State từ ESP:", ledState);

      // lưu DB log nguồn từ ESP
      if (pool?.connected) {
        await pool
          .request()
          .input("led1", sql.Bit, data.led1 === "ON" ? 1 : 0)
          .input("led2", sql.Bit, data.led2 === "ON" ? 1 : 0)
          .input("led3", sql.Bit, data.led3 === "ON" ? 1 : 0)
          .input("source", sql.VarChar, "ESP")
          .query(
            `INSERT INTO device_log (led1, led2, led3, source)
             VALUES (@led1, @led2, @led3, @source)`
          );
      }
    } catch (err) {
      console.error("❌ Lỗi parse LED state:", err.message);
    }
  }
});
app.post("/api/login", (req, res) => {
  // Ở đây bạn có thể check user/pass từ DB. Demo mình hardcode.
  const { username, password } = req.body;
  if (username === "admin" && password === "123456") {
    // tạo token hết hạn sau 1h
    const token = jwt.sign({ username: "admin" }, "SECRET_KEY", {
      expiresIn: "1h",
    });
    console.log("logged in! ", username);
    return res.json({ token });
  } else {
    return res.status(401).json({ error: "Sai username hoặc password" });
  }
});
// API - Lấy dữ liệu cảm biến mới nhất
app.get("/api/sensors", verifyToken, async (req, res) => {
  try {
    if (pool?.connected) {
      const result = await pool.request().query(`
        SELECT TOP 1 * FROM sensor_data ORDER BY id DESC
      `);
      if (result.recordset.length > 0) {
        return res.json(result.recordset[0]);
      }
    }
    res.json(sensorData); // fallback
  } catch (err) {
    console.error("❌ Lỗi truy vấn sensor_data:", err.message);
    res.status(500).json({ error: "DB query error" });
  }
});

// ✅ API - Lấy lịch sử dữ liệu cảm biến có sắp xếp
// ✅ API - Lấy lịch sử dữ liệu cảm biến có sắp xếp & tìm kiếm
app.get("/api/sensors/history", verifyToken, async (req, res) => {
  try {
    if (!pool?.connected) {
      return res.status(500).json({ error: "DB not connected" });
    }

    let sortField = req.query.sortField || "id";
    let order = req.query.order || "desc";
    let searchField = req.query.searchField || "all";
    let searchQuery = req.query.searchQuery || "";

    // kiểm tra field hợp lệ
    const allowedFields = ["id", "temperature", "humidity", "light", "timestamp"];
    if (!allowedFields.includes(sortField)) sortField = "id";
    if (!["asc", "desc"].includes(order.toLowerCase())) order = "desc";

    // cột timestamp
    const column = sortField === "timestamp" ? "timestamp" : sortField;

    // xây WHERE
    let where = "";
    if (searchQuery) {
      const q = `%${searchQuery}%`;
      if (searchField !== "all" && allowedFields.includes(searchField)) {
        where = `WHERE CAST(${searchField} AS NVARCHAR) LIKE @q`;
      } else {
        // tìm trong tất cả các cột
        where = `
          WHERE 
            CAST(id AS NVARCHAR) LIKE @q OR
            CAST(temperature AS NVARCHAR) LIKE @q OR
            CAST(humidity AS NVARCHAR) LIKE @q OR
            CAST(light AS NVARCHAR) LIKE @q OR
            CAST(timestamp AS NVARCHAR) LIKE @q
        `;
      }
    }

    const sqlQuery = `
      SELECT * FROM sensor_data 
      ${where}
      ORDER BY ${column} ${order.toUpperCase()}
    `;

    const result = await pool.request()
      .input("q", sql.NVarChar, `%${searchQuery}%`)
      .query(sqlQuery);

    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Lỗi lấy lịch sử sensor_data:", err.message);
    res.status(500).json({ error: "DB query error" });
  }
});


// API - Lấy trạng thái LED hiện tại
app.get("/api/led", verifyToken, (req, res) => {
  res.json(ledState);
});

// API - Điều khiển LED
app.post("/api/led", verifyToken, async (req, res) => {
  const { led1, led2, led3 } = req.body;
  if (
    !["ON", "OFF"].includes(led1) ||
    !["ON", "OFF"].includes(led2) ||
    !["ON", "OFF"].includes(led3)
  ) {
    return res.status(400).json({ error: "Sai tham số! Chỉ dùng ON hoặc OFF." });
  }

  // gửi lệnh điều khiển xuống ESP
  client.publish(
    "iot/led/control",
    JSON.stringify({ led1, led2, led3 })
  );

  // không tự cập nhật ledState nữa, chờ ESP phản hồi qua topic iot/led/state
  res.json({
    message: "Đã gửi lệnh điều khiển LED, chờ ESP phản hồi",
  });
});



// API - Lịch sử LED
// API - Lịch sử thay đổi LED
app.get("/api/led/history", verifyToken, async (req, res) => {
  try {
    if (!pool?.connected) {
      return res.status(500).json({ error: "DB not connected" });
    }

    let search = req.query.search || "";
    let sortField = req.query.sortField || "id";
    let order = req.query.order || "desc";

    // danh sách cột cho phép
    const allowedFields = ["id", "timestamp", "source"];
    if (!allowedFields.includes(sortField)) sortField = "id";
    if (!["asc", "desc"].includes(order.toLowerCase())) order = "desc";

    let where = "";
    if (search) {
      where = `WHERE 
        CAST(id AS NVARCHAR) LIKE @q OR
        CAST(source AS NVARCHAR) LIKE @q OR
        FORMAT(timestamp,'yyyy-MM-dd HH:mm:ss') LIKE @q`;
    }

    const sqlQuery = `
      SELECT
        id,
        led1,
        led2,
        led3,
        source,
        FORMAT(timestamp, 'yyyy-MM-dd HH:mm:ss') AS timestamp
      FROM device_log
      ${where}
      ORDER BY ${sortField} ${order.toUpperCase()}
    `;

    const result = await pool.request()
      .input("q", sql.NVarChar, `%${search}%`)
      .query(sqlQuery);

    const rows = result.recordset;

    // lọc chỉ LED thay đổi
    const changes = [];
    let prev = null;

    for (const row of rows) {
      if (!prev) {
        // lần đầu tiên: push nguyên trạng thái
        prev = row;
      } else {
        // so sánh từng led
        if (row.led1 !== prev.led1) {
          changes.push({
            id: row.id,
            timestamp: row.timestamp,
            source: row.source,
            led1: row.led1
          });
        } else if (row.led2 !== prev.led2) {
          changes.push({
            id: row.id,
            timestamp: row.timestamp,
            source: row.source,
            led2: row.led2
          });
        } else if (row.led3 !== prev.led3) {
          changes.push({
            id: row.id,
            timestamp: row.timestamp,
            source: row.source,
            led3: row.led3
          });
        }
      }
      prev = row;
    }

    res.json(changes);
  } catch (err) {
    console.error("❌ Lỗi lấy device_log:", err.message);
    res.status(500).json({ error: "DB query error" });
  }
});




const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend chạy tại http://localhost:${PORT}`);
});
