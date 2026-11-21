// ĐÚNG — key ổn định theo id:
{posts.map((p) => <PostCard key={p.id} post={p} />)}

// SAI — index làm key: xóa item đầu → state nội bộ "nhảy" (input của item
// thứ 2 nhận state của item thứ 1) vì React "giữ nhầm" node theo vị trí.
{posts.map((p, i) => <PostCard key={i} post={p} />)}
