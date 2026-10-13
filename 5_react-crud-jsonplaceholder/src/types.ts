// Kiểu dữ liệu khớp với https://jsonplaceholder.typicode.com/posts
export interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

export interface PostInput {
  title: string;
  body: string;
  userId: number;
}
