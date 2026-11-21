// ❌ Anti-pattern: effect đồng bộ prop -> state (thừa vòng, dễ loop)
useEffect(() => setFullName(first + " " + last), [first, last]);

// ✅ Derived trong render (example.tsx fullName) — không effect, không vòng thừa
const fullName = `${first} ${last}`;
