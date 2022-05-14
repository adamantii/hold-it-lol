"use strict";

var distance = function (a, b) {
    var _a;
    if (a.length === 0)
        return b.length;
    if (b.length === 0)
        return a.length;
    if (a.length > b.length)
        _a = [b, a], a = _a[0], b = _a[1];
    var row = [];
    for (var i = 0; i <= a.length; i++)
        row[i] = i;
    for (var i = 1; i <= b.length; i++) {
        var prev = i;
        for (var j = 1; j <= a.length; j++) {
            var val = void 0;
            if (b.charAt(i - 1) === a.charAt(j - 1))
                val = row[j - 1];
            else
                val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
            row[j - 1] = prev;
            prev = val;
        }
        row[a.length] = prev;
    }
    return row[a.length];
};

var closestMatch = function (target, array, showOccurrences) {
    if (showOccurrences === void 0) { showOccurrences = false; }
    if (array.length === 0)
        return null;
    var vals = [];
    var found = [];
    for (var i = 0; i < array.length; i++)
        vals.push((0, distance)(target, array[i]));
    var min = Math.min.apply(Math, vals);
    for (var i = 0; i < vals.length; i++) {
        if (vals[i] === min)
            found.push(array[i]);
    }
    return showOccurrences ? found : found[0];
};
