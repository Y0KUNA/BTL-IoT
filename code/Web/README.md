# IoT Dashboard

A modern, responsive single-page web application for monitoring and controlling IoT devices with real-time sensor data visualization and LED control functionality.

## Features

### 🏠 Home Dashboard
- **Real-time Sensor Monitoring**: Temperature, humidity, and light sensors with live status indicators
- **LED Control Panel**: Interactive switches to control up to 3 LED devices with power consumption tracking
- **Data Visualization**: Interactive charts showing sensor trends over time with multiple view options
- **Status Indicators**: Color-coded status badges (Normal, High, Low, Optimal) for quick assessment

### 👤 Profile Management
- **User Information**: Display and edit personal details including name, student ID, and project links
- **Profile Picture**: Upload and change profile images with click-to-edit functionality
- **Data Export/Import**: Save and restore profile data in JSON format

### 📊 Sensor History
- **Historical Data View**: Comprehensive table view of all sensor readings with timestamps
- **Advanced Filtering**: Filter by date, time, and sensor type for detailed analysis
- **Statistics Panel**: Real-time statistics showing min, max, and average values
- **Data Visualization**: Mini charts showing data trends and patterns
- **Export Functionality**: Download sensor data in JSON format for external analysis

### 🔌 Device Control History
- **LED Control Log**: Complete history of all LED device state changes
- **Search & Filter**: Find specific control events by timestamp or device name
- **Pagination**: Efficient browsing through large datasets
- **Export Options**: Export control history in CSV or JSON formats
- **Data Management**: Import/export functionality for backup and restore

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Styling**: Custom CSS with Grid and Flexbox layouts
- **Fonts**: Inter font family from Google Fonts
- **Icons**: Custom SVG icons for sensors and controls
- **Storage**: Browser localStorage for data persistence
- **Architecture**: Component-based modular design

## Project Structure

```
iot-dashboard/
├── index.html              # Main HTML file
├── css/
│   ├── style.css          # Global styles and layout
│   └── components.css     # Component-specific styles
├── js/
│   ├── app.js            # Main application controller
│   ├── utils.js          # Utility functions and helpers
│   └── components/
│       ├── home.js       # Home dashboard component
│       ├── profile.js    # Profile management component
│       ├── sensors.js    # Sensor history component
│       └── history.js    # LED control history component
└── README.md             # Project documentation
```

## Installation & Setup

1. **Clone or Download**: Get the project files to your local machine
2. **Open in Browser**: Simply open `index.html` in any modern web browser
3. **No Build Process Required**: This is a vanilla JavaScript application with no dependencies

### Browser Requirements
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Usage Guide

### Navigation
The application features a tab-based navigation system with four main sections:
- **Profile**: User information and settings
- **Home**: Main dashboard with live sensor data and controls
- **Sensors**: Historical sensor data analysis
- **History**: LED control event history

### Home Dashboard

#### Sensor Cards
- **Temperature**: Displays current temperature with status indicator
- **Humidity**: Shows humidity percentage with status indicator
- **Light**: Displays light intensity in lux with status indicator

#### LED Controls
- Click the toggle switches to turn LEDs on/off
- Monitor real-time power consumption
- Connected status indicator shows system health

#### Sensor Chart
- Switch between Temperature, Humidity, and Light views
- View real-time trends and historical patterns
- Check current, minimum, maximum, and average values

### Profile Management
- Click on any field to edit (name, student ID, links)
- Click on profile image to upload a new picture
- All changes are automatically saved to browser storage

### Sensor History
- Use date and time filters to find specific data points
- Switch between sensor types using the tab buttons
- View comprehensive statistics and mini charts
- Export filtered data for external analysis

### Device History
- Search through LED control events using the search box
- Navigate through pages using pagination controls
- Export history data in multiple formats

## Data Management

### Local Storage
The application uses browser localStorage to persist:
- User profile information
- LED control history
- Application preferences

### Data Export/Import
- **Profile Data**: JSON format with user information
- **Sensor Data**: JSON format with readings and statistics
- **Control History**: CSV or JSON format with device events

### Data Generation
The application includes realistic data generators for:
- Temperature readings (20-35°C range)
- Humidity levels (40-90% range)
- Light intensity (100-1000 lux range)
- Randomized LED control events

## Customization

### Styling
- Modify `css/style.css` for global appearance changes
- Edit `css/components.css` for component-specific styling
- Color scheme variables can be updated for rebranding

### Data Sources
- Replace `DataGenerator` functions in `utils.js` with real API calls
- Modify sensor update intervals in `app.js`
- Add new sensor types by extending component classes

### Components
- Add new dashboard sections by creating component classes
- Extend existing components for additional functionality
- Implement new chart types in `ChartUtils`

## Browser Support

The application is designed to work on all modern browsers and includes:
- **Responsive Design**: Adapts to different screen sizes
- **Mobile Support**: Touch-friendly interface for tablets and phones
- **Accessibility**: Semantic HTML and keyboard navigation support

## Performance

- **Lightweight**: No external dependencies, minimal file size
- **Efficient**: Component-based rendering with selective updates
- **Fast Loading**: Optimized CSS and JavaScript delivery
- **Memory Management**: Automatic cleanup and data limiting

## Troubleshooting

### Common Issues

1. **Data Not Persisting**: Check if localStorage is enabled in your browser
2. **Charts Not Displaying**: Ensure SVG support is available
3. **Mobile Layout Issues**: Verify viewport meta tag is present
4. **Performance Issues**: Clear browser cache and refresh

### Browser Console
Enable developer tools to see detailed error messages and debug information.

## Contributing

To contribute to this project:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test across different browsers
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Contact

For questions or support regarding this IoT Dashboard application, please refer to the profile section for contact information.

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Compatibility**: Modern browsers with ES6 support
