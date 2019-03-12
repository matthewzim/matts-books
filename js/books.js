for (var i = 1; i < 25; i++) {
  $("#books").append(
    '<img class = "book-images" id = ' + i + ' src = "jpg/' + i + '.jpg">'
  );
  getSize(i);
}

$.getJSON("json/books.json", function(books) {
  // console.log(books[0].Number);
  // console.log(books[0].Title);
  // console.log(books[0].Author);

  $(".book-images").hover(function(){
    $("#number").html("(#" + books[this.id-1].Number + ")");
    $("#title").html(books[this.id-1].Title);
    $("#author").html(books[this.id-1].Author);
    // console.log(this.id);
    $("#description").css("display", "flex");
    }, function(){
    $("#description").css("display", "none");
  });
});


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


getTheTime();
function getTheTime() {
  var d = new Date();
  var n = d.toLocaleTimeString();
  document.getElementById("time").innerHTML = n;
}
setInterval(getTheTime, 1000);
