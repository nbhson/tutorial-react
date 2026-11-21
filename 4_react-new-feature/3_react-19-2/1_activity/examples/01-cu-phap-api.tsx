import { Activity } from 'react';

<Activity mode={tab === 'chat' ? 'visible' : 'hidden'}>
  <ChatPanel /> {/* state + DOM giữ khi hidden; Effects bị dọn */}
</Activity>

<Activity mode="hidden">      {/* pre-render ngay từ đầu */}
  <SlowPanel />
</Activity>

<Activity>                    {/* mặc định visible */}
  <Comments />
</Activity>
