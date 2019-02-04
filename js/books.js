$.getJSON("json/books.json", function(books) {

  

  console.log(books[1].Number);
  console.log(books[1].Title);
  console.log(books[1].Author);
});

for (var i = 1; i < 25; i++) {
  $("#books").append(
    '<img class = "book-images" id = ' + i + ' src = "jpg/' + i + '.jpg">'
  );
  getSize(i);
}

function getSize(number) {
  var img = document.getElementById(number);

  var width = img.naturalWidth;
  var height = img.naturalHeight;

  var newWidth = width / 5;
  var newHeight = height / 5;

  widthString = newWidth.toString();
  heightString = newHeight.toString();

  img.style.height = heightString + 'px';
  img.style.width = widthString + 'px';
}
