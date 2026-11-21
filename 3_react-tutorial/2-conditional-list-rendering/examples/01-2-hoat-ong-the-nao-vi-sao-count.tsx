{unread > 0 && <span>Bạn có {unread} tin nhắn</span>} // ✅ boolean
// {count && <X/>}  // ❌ count = 0 → in "0"
{count > 0 && <X/>} // ✅
