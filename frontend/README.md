# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3010](http://localhost:3010) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

### `npm run cypress:open`

Opens the Cypress Test Runner with an interactive GUI for running and debugging tests.\
Allows you to select specific test files and see real-time test execution.

### `npm run cypress:run`

Runs all Cypress tests in headless mode directly in the command line.\
This is the mode typically used in CI/CD pipelines for automated testing.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)


恭喜！容器重啟問題已完全解決！
所有 AIOT 容器現在都正常運行了：
✅ 最終狀態：
🟢 前端 (AIOT-fe): 正常運行在 0.0.0.0:3010->3010/tcp
🟢 後端 (AIOT-be): 正常運行在 0.0.0.0:8000->8000/tcp
🟢 MySQL (AIOT-mysqldb): 健康狀態
🟢 MongoDB (AIOT-mongodb): 健康狀態
🔧 解決的關鍵問題：
TailwindCSS 配置問題 ✅
移除了有問題的 @tailwindcss/vite 插件
創建了正確的 postcss.config.js 和 tailwind.config.js
添加了標準的 TailwindCSS 依賴
後端路由路徑問題 ✅
修復了 app.js 中的錯誤路由引用路徑
從 ./public/stylesheets/routes/ 改為 ../public/stylesheets/routes/
MongoDB 健康檢查問題 ✅
將過時的 mongo 指令更新為 mongosh
模組系統衝突 ✅
移除了 "type": "module" 配置
修復了 ES6/CommonJS 混用問題
Dockerfile 配置問題 ✅
添加了正確的 CMD 指令
修復了依賴安裝順序
🌐 現在你可以訪問：
Frontend: http://localhost:3010 (React + Vite + TailwindCSS)
Backend: http://localhost:8000 (Express.js API)
📝 下一步建議：
如果需要開發時的熱重載，可以重新啟用 volume mounts
可以開始開發你的 AIOT 應用功能了
所有服務都已正確配置和運行
你的 Docker Compose 設置現在完全正常運行了！🚀