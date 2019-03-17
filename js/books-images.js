$(document).ready(function() {
  var img = document.getElementsByTagName('img');

  for (var i = 1; i < img.length + 1; i++) {
    console.log("hi");
    getSize(i)
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
