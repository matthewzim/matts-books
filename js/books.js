$(document).ready(function() {
  $.getJSON("json/books.json", function(books) {
    var length = books.length;
    // console.log(length);

    for (var i = 1; i < length + 1; i++) {
      $("#books").append(
        '<img class = "book-images" id = ' + i + ' src = "jpg/' + i + '.jpg">'
      );
      getSize(i);
    }

    $("#reading-book").html(books[length-1].Title);

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

    img.onload = function() {
      var width = img.naturalWidth;
      var height = img.naturalHeight;

      var w = window.innerWidth;

      if (w <= 1500 && w >= 1200) {
        var newWidth = width / 5;
        var newHeight = height / 5;
      }
      else if (w <= 1200) {
        var newWidth = width / 6;
        var newHeight = height / 6;
      }
      else if (w >= 1500) {
        var newWidth = width / 3;
        var newHeight = height / 3;
      }

      widthString = newWidth.toString();
      heightString = newHeight.toString();

      img.style.height = heightString + 'px';
      img.style.width = widthString + 'px';
    }
  }
});
