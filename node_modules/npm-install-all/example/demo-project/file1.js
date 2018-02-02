var _ = require("underscore");
var calendars = [1, "String", {}, 1.1, true],
    newArray = [];

_.each(calendars, function (item, index) {
    newArray.push(item);
});

console.log(newArray);