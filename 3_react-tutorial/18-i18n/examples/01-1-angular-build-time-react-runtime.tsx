// Mini trong example.tsx: lang state + dict — đổi là re-render, không reload
const [lang, setLang] = useState<Lang>("vi");
const t = useMemo(() => dict[lang], [lang]);
<button onClick={() => setLang("en")}>EN</button> // bấm là mọi t.* đổi ngay
