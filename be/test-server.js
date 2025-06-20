import('./src/server.ts').then(() => {
  console.log('✅ Server started successfully');
}).catch((error) => {
  console.error('❌ Server failed to start:');
  console.error(error);
  process.exit(1);
}); 