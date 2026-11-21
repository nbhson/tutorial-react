// ĐÚNG — key ổn định theo id
{posts.map((p) => <PostCard key={p.id} post={p} />)}

// SAI — index làm key: xóa/đảo thứ tự sẽ giữ nhầm state nội bộ
{posts.map((p, i) => <PostCard key={i} post={p} />)}

// SAI — tự sửa DOM bằng ref mỗi lần state đổi: phá vỡ diff
ref.current.textContent = count; // ❌ hãy để {count} trong JSX lo
