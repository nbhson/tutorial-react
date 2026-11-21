<Activity mode={show ? 'visible' : 'hidden'}><Panel /></Activity>

const onEvent = useEffectEvent((x) => { /* đọc props/state mới nhất */ });

const getData = cache(async (id) => fetch(url, { signal: cacheSignal() }));

const { prelude, postponed } = await prerender(<App />); // react-dom/static
const stream = await resume(<App />, postponed);          // react-dom/server
