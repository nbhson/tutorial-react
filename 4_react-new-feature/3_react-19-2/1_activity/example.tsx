import { Activity, useState } from 'react';

function ChatPanel() {
  const [draft, setDraft] = useState('');
  return (
    <div>
      <h3>Chat</h3>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Nhập draft..."
      />
      <p>Draft: {draft || '(trống)'}</p>
    </div>
  );
}

function SettingsPanel() {
  const [name, setName] = useState('Ada');
  return (
    <div>
      <h3>Settings</h3>
      <input value={name} onChange={(e) => setName(e.target.value)} />
    </div>
  );
}

export default function ActivityDemo() {
  const [tab, setTab] = useState<'chat' | 'settings'>('chat');

  return (
    <div>
      <h2>Activity (React 19.2)</h2>
      <button onClick={() => setTab('chat')}>Chat</button>
      <button onClick={() => setTab('settings')}>Settings</button>
      {/* hidden nhưng KHÔNG unmount → draft giữ nguyên */}
      <Activity mode={tab === 'chat' ? 'visible' : 'hidden'}>
        <ChatPanel />
      </Activity>
      <Activity mode={tab === 'settings' ? 'visible' : 'hidden'}>
        <SettingsPanel />
      </Activity>
    </div>
  );
}
