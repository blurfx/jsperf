self.onmessage = async (event) => {
  const { code } = event.data;
  let time;
  try {
    time = await eval(`async () => {
      const start = performance.now();
      for (let i = 0; i < 10; i++) {
        ${code};
      }
      return performance.now() - start;
    }`)();
  } catch (e) {
    time = -1;
  }
  self.postMessage(time || 1);
};
