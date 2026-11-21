// SAI: re-render cả form + validate cả form mỗi phím
const [values, setValues] = useState(initial);
const errors = validateAll(values);  // chạy lại MỌI lần setValues
// input A gõ 1 ký tự → setValues({...values, a}) → render cả form + validate 20 field
