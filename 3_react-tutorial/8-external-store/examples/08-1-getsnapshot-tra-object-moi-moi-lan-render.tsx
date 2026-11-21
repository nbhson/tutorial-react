// ❌ SAI: copy mới mỗi lần — Object.is luôn khác, React tưởng đổi liên tục
getSnapshot() { return [...cartStore.items]; } // cảnh báo "getSnapshot should be cached"
