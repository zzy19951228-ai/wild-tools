var fence = String.fromCharCode(96).repeat(3);
var resp = fence + 'json' + String.fromCharCode(10) + '{' + String.fromCharCode(10) + '  "title": "AI工程师", "city": "杭州", "salary_min": 18, "salary_max": 30,' + String.fromCharCode(10) + '  "suggested": { "pay": 4, "loc": 5, "dir": 5, "stb": 3, "gro": 3 }' + String.fromCharCode(10) + '}' + String.fromCharCode(10) + fence;
var t = String(resp).replace(new RegExp(fence + '(json)?', 'gi'), '');
var a = t.indexOf('{'), b = t.lastIndexOf('}');
var d = JSON.parse(t.slice(a, b + 1));
console.log('提取OK:', d.title, d.city, d.salary_min + '-' + d.salary_max + 'k', 'pay=' + d.suggested.pay);