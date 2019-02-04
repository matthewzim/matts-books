$.getJSON("json/books.json", function(json) {
  console.log(json[1].Number);
});

for (var i = 1; i < 25; i++) {
  $("#books").append(
    '<img class = "book-images" id = ' + i + ' src = "jpg/' + i + '.jpg">'
  );
  getSize(i);
}

function getSize(number) {
  var img = document.getElementById(number);
  //or however you get a handle to the IMG
  var width = img.naturalWidth;
  var height = img.naturalHeight;

  console.log(width);
  console.log(height);

  var newWidth = width / 4.5;
  var newHeight = height / 4.5;

  console.log(newWidth);
  console.log(newHeight);

  widthString = newWidth.toString();
  heightString = newHeight.toString();

  console.log(widthString);

  img.style.height = heightString + 'px';
  img.style.width = widthString + 'px';
}
