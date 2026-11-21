// Angular (framework): mọi thứ đóng gói sẵn trong @angular/*.
// Router, HttpClient, DI đều là một phần của framework, không cần cài thêm.
import { Component, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Component({ template: "<p>...</p>" })
export class CounterComponent {
  private http = inject(HttpClient); // DI container của framework
}
