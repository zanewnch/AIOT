// 清除瀏覽器中的無效 token
// 在瀏覽器控制台中執行此腳本

console.log('清除前的 localStorage:');
console.log('authToken:', localStorage.getItem('authToken'));

// 清除 authToken
localStorage.removeItem('authToken');

console.log('已清除 authToken');
console.log('清除後的 localStorage:');
console.log('authToken:', localStorage.getItem('authToken'));

// 重新載入頁面
console.log('正在重新載入頁面...');
window.location.reload();