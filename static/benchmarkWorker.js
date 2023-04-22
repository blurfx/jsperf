self.onmessage = async (event) => {
  const { code, duration } = event.data;
  let result;
  await (async () => {
    try {
      result = await eval(`async () => {
        let ops = 0;
        let end = performance.now() + duration;
        while (performance.now() < end) {
          ${code};
          ops++;
        }
        return ops;
      }`)();
    } catch (e) {
      result = -1;
    }
    postMessage(result === -1 ? result : (result * (1000 / duration)) << 0);
  })();
};
