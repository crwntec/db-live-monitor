# ![ghlogo](https://github.com/crwntec/db-live-monitor/assets/77750176/21e6bb43-014b-42f9-880a-8c2a4c1f42db)  
## Unofficial Live Departure Monitor for German Railway Stations  


🚧 **Heavy Development & Beta Status!** 🚧  
This project is undergoing **major development** and is currently in **beta**. Expect frequent updates, breaking changes, and occasional downtime. Your feedback is highly appreciated!  

Available at **[https://db-live-view.onrender.com](https://db-live-view.onrender.com)**. Let me know what you think!  

## 🚨 Disclaimer  
This project is a passion-driven effort and is still evolving. While I strive for accuracy, I can't guarantee the data is always 100% reliable.  

## 📡 Data Sources  
This project now uses **custom-built libraries** for data processing, replacing HAFAS. The primary data source is now based on the DB-Web-API used by [Regio-Guide](https://regio-guide.de/) additionally and unchanged: 

- **IRIS:** [Timetable data and train order](https://iris.noncd.db.de/wbt/js/index.html)

A huge thanks to **derf** from finalrewind.org for the inspiration behind this project!  

## 🚀 Roadmap & Future Features  
Big things are coming! Check out our [Roadmap Issue](https://github.com/crwntec/db-live-monitor/issues/1) to see upcoming features and ways to contribute.  

## 🛠 How to Run the Project  
You'll need **Node.js v19+** to get started.  

1. **Install dependencies and start the development server:**  
   ```shell
   npm install
   npm run dev
   ```  
   This starts the Next.js app with live updates.  

2. **Build and run in production mode:**  
   ```shell
   npm run build
   npm start
   ```  

## 🤝 Contributing  
Spotted a bug? Have a cool idea? [Create an issue](https://github.com/crwntec/db-live-monitor/issues) and let's improve this together!  

## 📜 License  
This project is licensed under the [MIT License](LICENSE).  