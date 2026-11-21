// ❌ SAI: useSortable nhưng không gắn ref — không đo được, over luôn null
const { setNodeRef, ...rest } = useSortable({ id }); return <li {...rest.attributes}>Hi</li>;
