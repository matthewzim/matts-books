$(document).ready(function() {

  console.log("fuck these images");
  var img = document.getElementsByTagName('img');

  for (var i = 0; i < img.length; i++) {
    getSize(i + 1)
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

});
