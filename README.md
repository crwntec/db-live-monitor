# ![ghlogo](https://github.com/crwntec/db-live-monitor/assets/77750176/21e6bb43-014b-42f9-880a-8c2a4c1f42db)

# DB Live Monitor

Unofficial Live Departure Monitor for German Railway Stations

## 🚧 Project Status

This project is undergoing **major development** and is currently in **beta**. Expect frequent updates, breaking changes, and occasional downtime. Your feedback is highly appreciated!

**Live Demo:** [https://db-live-monitor.vercel.app](https://db-live-monitor.vercel.app)

## 🚨 Disclaimer

This project is a passion-driven effort and is still evolving. While I strive for accuracy, I can't guarantee the data is always 100% reliable. This is an unofficial project and is not affiliated with Deutsche Bahn AG.

## 📡 Data Sources

This project uses multiple data sources to provide comprehensive railway information:

- **[DB Vendo API](https://github.com/public-transport/db-vendo-client)**: Board data (departure/arrival information) and journey details
- **[ÖBB HAFAS](https://github.com/public-transport/hafas-client)**: Train number searching
- **[IRIS](https://iris.noncd.db.de/wbt/js/index.html)**: Timetable data and train order information

**Note:** Regio Guide has been deprecated and replaced with the DB Vendo API for improved data access. Also I use semi-customized wrappers for the apis because of limitations inside of NextJS. 

### Acknowledgments

A huge thanks to **derf** from finalrewind.org for the inspiration behind this project!

## ✨ Features

- Real-time departure and arrival information
- Train journey details
- Train number search functionality
- Train order/composition information

## 🚀 Roadmap & Future Features

Big things are coming! Check out our [Roadmap Issue](https://github.com/crwntec/db-live-monitor/issues/1) to see upcoming features and ways to contribute.

## 🛠 Installation & Usage

### Prerequisites

- Node.js v19 or higher

### Development

1. Clone the repository:
   ```bash
   git clone https://github.com/crwntec/db-live-monitor.git
   cd db-live-monitor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000` with hot reloading enabled.

### Production

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

- **Report bugs**: [Create an issue](https://github.com/crwntec/db-live-monitor/issues) describing the problem
- **Suggest features**: Share your ideas through issues
- **Submit pull requests**: Fork the repo and submit your improvements

Please ensure your contributions align with the project's goals and coding standards.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 💬 Feedback

Have questions or suggestions? Feel free to [open an issue](https://github.com/crwntec/db-live-monitor/issues) or reach out!

---

**Disclaimer:** This is an unofficial project and is not affiliated with, endorsed by, or connected to Deutsche Bahn AG or any other railway operator.