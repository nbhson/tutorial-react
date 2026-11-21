// Framework: NÓ gọi bạn, đúng thời điểm NÓ muốn.
// Angular: @Component + lifecycle hook — Angular gọi ngOnInit, ngOnDestroy...
// của bạn, không phải bạn gọi Angular.
@Component({ selector: "app-user", template: "..." })
export class UserComponent implements OnInit {
  ngOnInit(): void { /* do Angular gọi khi component mount */ }
}
