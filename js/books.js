$(document).ready(function() {
  const $books = $("#books");
  const $booksView = $("#books-view");
  const $layoutControls = $("#layout-controls");
  const $bottomMenu = $("#bottom-menu");
  const $menuToggle = $("#layout-menu-toggle");
  const $themeToggle = $("#theme-toggle");
  const $rowToggle = $("#row-toggle");
  const $scrollToggle = $("#scroll-toggle");
  const $interactionToggle = $("#interaction-toggle");
  const rootElement = document.documentElement;
  const BASE_SCALE = 1.25;
  const MIN_VARIATION = 0.9;
  const MAX_VARIATION = 1.1;
  let arrangementFrameId = null;
  let interactionMode = $interactionToggle.val();
  let draggedElement = null;

  function getDivisor() {
    const width = window.innerWidth || 0;

    if (width >= 1500) {
      return 3;
    }

    if (width >= 1200) {
      return 5;
    }

    return 6;
  }

  function getBookVariation(bookNumber) {
    const number = Number(bookNumber);

    if (!Number.isFinite(number)) {
      return 1;
    }

    const seededRandom = Math.sin(number * 12.9898) * 43758.5453;
    const fraction = seededRandom - Math.floor(seededRandom);

    return MIN_VARIATION + fraction * (MAX_VARIATION - MIN_VARIATION);
  }

  function updateBookDimensions(img) {
    if (!img) {
      return;
    }

    const naturalWidth = Number(img.dataset.naturalWidth || 0);
    const naturalHeight = Number(img.dataset.naturalHeight || 0);

    if (!naturalWidth || !naturalHeight) {
      return;
    }

    const sizeVariation = Number(img.dataset.sizeVariation || 1);
    const divisor = getDivisor();
    const scale = BASE_SCALE * sizeVariation;
    const newWidth = (naturalWidth / divisor) * scale;
    const newHeight = (naturalHeight / divisor) * scale;

    img.style.width = newWidth + "px";
    img.style.height = newHeight + "px";
  }

  function updateAllBookDimensions() {
    $books.children(".book-images").each(function() {
      updateBookDimensions(this);
    });
  }

  function scheduleBookArrangement() {
    if (arrangementFrameId !== null) {
      window.cancelAnimationFrame(arrangementFrameId);
    }

    arrangementFrameId = window.requestAnimationFrame(applyTwoRowOverflowLayout);
  }

  function clearBookPlacement($items) {
    $items.each(function() {
      this.style.gridRow = "";
      this.style.gridColumn = "";
      this.style.left = "";
      this.style.top = "";
      this.style.position = "";
    });
  }

  function applyTwoRowOverflowLayout() {
    arrangementFrameId = null;

    const rowMode = $rowToggle.val();
    const scrollMode = $scrollToggle.val();
    const $items = $books.children(".book-images");
    const booksElement = $books.get(0);

    if (!booksElement) {
      return;
    }

    if (!$items.length) {
      booksElement.style.width = "";
      booksElement.style.height = "";
      booksElement.style.removeProperty("--two-row-divider-top");
      return;
    }

    if (rowMode !== "two" || scrollMode !== "horizontal") {
      clearBookPlacement($items);
      booksElement.style.width = "";
      booksElement.style.height = "";
      booksElement.style.removeProperty("--two-row-divider-top");
      return;
    }

    const availableWidth = $booksView.innerWidth();

    if (!availableWidth) {
      clearBookPlacement($items);
      booksElement.style.width = "";
      booksElement.style.height = "";
      booksElement.style.removeProperty("--two-row-divider-top");
      return;
    }

    clearBookPlacement($items);
    booksElement.style.width = "";
    booksElement.style.height = "";
    booksElement.style.removeProperty("--two-row-divider-top");

    const totalItems = $items.length;
    const minColumns = Math.ceil(totalItems / 2);
    const itemWidths = $items
      .map(function() {
        return Math.ceil($(this).outerWidth(true));
      })
      .get();
    const itemHeights = $items
      .map(function() {
        return Math.ceil($(this).outerHeight(true));
      })
      .get();
    const gapValue = parseFloat(
      window
        .getComputedStyle(booksElement)
        .getPropertyValue("--two-row-gap")
    );
    const rowGap = Number.isFinite(gapValue) ? gapValue : 0;

    var optimalColumns = null;

    for (let columns = minColumns; columns <= totalItems; columns++) {
      let widthSum = 0;
      const secondRowLength = totalItems - columns;

      for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
        const topWidth = itemWidths[columnIndex] || 0;
        const bottomIndex = columns + columnIndex;
        const bottomWidth = columnIndex < secondRowLength ? itemWidths[bottomIndex] : 0;

        widthSum += Math.max(topWidth, bottomWidth);
      }

      if (widthSum <= availableWidth) {
        optimalColumns = columns;
      }
    }

    if (optimalColumns === null) {
      optimalColumns = minColumns;
    }

    const firstRowCount = Math.min(optimalColumns, totalItems);
    const secondRowCount = totalItems - firstRowCount;

    const topLeftOffsets = [];
    let currentLeft = 0;
    let topRowWidth = 0;
    let maxTopHeight = 0;

    const topRowEntries = [];

    for (let index = 0; index < firstRowCount; index++) {
      const element = $items.get(index);

      if (!element) {
        continue;
      }

      const elementWidth = itemWidths[index] || 0;
      const elementHeight = itemHeights[index] || 0;

      element.style.position = "absolute";
      element.style.left = currentLeft + "px";
      element.style.top = "0px";

      topLeftOffsets.push(currentLeft);
      currentLeft += elementWidth;
      topRowWidth = currentLeft;
      if (elementHeight > maxTopHeight) {
        maxTopHeight = elementHeight;
      }

      topRowEntries.push({ element, height: elementHeight });
    }

    let bottomLeft = 0;
    let bottomRowWidth = 0;
    let maxBottomHeight = 0;

    const bottomRowEntries = [];

    for (let index = 0; index < secondRowCount; index++) {
      const element = $items.get(firstRowCount + index);

      if (!element) {
        continue;
      }

      const elementWidth = itemWidths[firstRowCount + index] || 0;
      const elementHeight = itemHeights[firstRowCount + index] || 0;
      const preferredLeft =
        topLeftOffsets[index] !== undefined ? topLeftOffsets[index] : bottomLeft;
      const resolvedLeft = Math.max(preferredLeft, bottomLeft);

      element.style.position = "absolute";
      element.style.left = resolvedLeft + "px";
      element.style.top = maxTopHeight + rowGap + "px";

      bottomLeft = resolvedLeft + elementWidth;
      if (bottomLeft > bottomRowWidth) {
        bottomRowWidth = bottomLeft;
      }
      if (elementHeight > maxBottomHeight) {
        maxBottomHeight = elementHeight;
      }

      bottomRowEntries.push({ element, height: elementHeight });
    }

    topRowEntries.forEach(function(entry) {
      const offset = maxTopHeight - entry.height;
      entry.element.style.top = offset > 0 ? offset + "px" : "0px";
    });

    bottomRowEntries.forEach(function(entry) {
      const baseline = maxTopHeight + rowGap;
      const offset = baseline + (maxBottomHeight - entry.height);
      entry.element.style.top = offset > 0 ? offset + "px" : baseline + "px";
    });

    const contentWidth = Math.max(topRowWidth, bottomRowWidth);
    let contentHeight = maxTopHeight;

    if (secondRowCount > 0) {
      contentHeight += rowGap + maxBottomHeight;
      const dividerOffset = maxTopHeight + rowGap / 2;
      booksElement.style.setProperty(
        "--two-row-divider-top",
        dividerOffset + "px"
      );
    }

    booksElement.style.width = contentWidth ? contentWidth + "px" : "";
    booksElement.style.height = contentHeight ? contentHeight + "px" : "";
  }

  function closeLayoutMenu() {
    if (!$bottomMenu.hasClass("is-open")) {
      return;
    }

    $bottomMenu.removeClass("is-open");
    $menuToggle.attr("aria-expanded", "false");
    $layoutControls.attr("aria-hidden", "true");
  }

  $menuToggle.on("click", function(event) {
    event.stopPropagation();

    const willOpen = !$bottomMenu.hasClass("is-open");
    $bottomMenu.toggleClass("is-open", willOpen);
    $menuToggle.attr("aria-expanded", willOpen);
    $layoutControls.attr("aria-hidden", !willOpen);
  });

  $layoutControls.on("click", function(event) {
    event.stopPropagation();
  });

  $(document).on("click", function() {
    closeLayoutMenu();
  });

  $(document).on("keydown", function(event) {
    if (event.key === "Escape") {
      closeLayoutMenu();
    }
  });

  function applyLayout() {
    const rowMode = $rowToggle.val();
    const scrollMode = $scrollToggle.val();

    $books
      .removeClass("layout-one-row layout-two-rows orientation-horizontal orientation-vertical")
      .addClass(rowMode === "one" ? "layout-one-row" : "layout-two-rows")
      .addClass(scrollMode === "horizontal" ? "orientation-horizontal" : "orientation-vertical");

    $booksView
      .removeClass("scroll-horizontal scroll-vertical view-one-row view-two-rows")
      .addClass(scrollMode === "horizontal" ? "scroll-horizontal" : "scroll-vertical")
      .addClass(rowMode === "one" ? "view-one-row" : "view-two-rows");

    scheduleBookArrangement();
  }

  function applyTheme() {
    const theme = $themeToggle.val();
    rootElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("mb-theme", theme);
    } catch (error) {
      // Ignore storage errors (e.g. private mode)
    }
  }

  $rowToggle.on("change", applyLayout);
  $scrollToggle.on("change", applyLayout);
  $interactionToggle.on("change", applyInteractionMode);
  $themeToggle.on("change", applyTheme);

  const storedTheme = (function() {
    try {
      return localStorage.getItem("mb-theme");
    } catch (error) {
      return null;
    }
  })();

  if (storedTheme === "dark" || storedTheme === "light") {
    $themeToggle.val(storedTheme);
  }

  applyTheme();

  $.getJSON("json/books.json", function(books) {
    var length = books.length;
    // console.log(length);

    for (var i = 1; i < length + 1; i++) {
      $books.append(
        '<img class = "book-images" draggable = "true" id = ' + i + ' src = "jpg/' + i + '.jpg">'
      );
      getSize(i);
    }

    $("#reading-book").html(books[length - 1].Title);

    $books.on("mouseenter", ".book-images", function() {
      if (interactionMode !== "info") {
        return;
      }

      $("#number").html("");
      $("#title").html(books[this.id - 1].Title);
      $("#author").html(books[this.id - 1].Author);
      $("#description").css("display", "flex");
    });

    $books.on("mouseleave", ".book-images", function() {
      if (interactionMode !== "info") {
        return;
      }

      $("#description").css("display", "none");
    });

    applyLayout();
    applyInteractionMode();
    scheduleBookArrangement();
  });

  initializeDragAndDrop();

  function applyInteractionMode() {
    interactionMode = $interactionToggle.val();
    const isDragMode = interactionMode === "drag";

    $books
      .toggleClass("mode-drag", isDragMode)
      .toggleClass("mode-info", !isDragMode)
      .find(".book-images")
      .attr("draggable", isDragMode);

    if (isDragMode) {
      $("#description").css("display", "none");
    } else {
      draggedElement = null;
      $books.find(".book-images").removeClass("is-dragging drop-target");
    }
  }

  function getSize(number) {
    var img = document.getElementById(number);

    img.onload = function() {
      const variation = getBookVariation(number);

      img.dataset.naturalWidth = img.naturalWidth;
      img.dataset.naturalHeight = img.naturalHeight;
      img.dataset.sizeVariation = variation;

      updateBookDimensions(img);
      scheduleBookArrangement();
    };

    if (img.complete && img.naturalWidth && img.naturalHeight) {
      img.onload();
    }
  }

  function handleWindowResize() {
    updateAllBookDimensions();
    scheduleBookArrangement();
  }

  function initializeDragAndDrop() {
    $books.on("dragstart", ".book-images", function(event) {
      if (interactionMode !== "drag") {
        event.preventDefault();
        return;
      }

      draggedElement = this;
      event.originalEvent.dataTransfer.effectAllowed = "move";
      event.originalEvent.dataTransfer.setData("text/plain", this.id);
      $(this).addClass("is-dragging");
    });

    $books.on("dragend", ".book-images", function() {
      if (interactionMode !== "drag") {
        return;
      }

      $(this).removeClass("is-dragging");
      $books.find(".drop-target").removeClass("drop-target");
      draggedElement = null;
    });

    $books.on("dragenter", ".book-images", function() {
      if (interactionMode !== "drag") {
        return;
      }

      if (this !== draggedElement) {
        $(this).addClass("drop-target");
      }
    });

    $books.on("dragover", ".book-images", function(event) {
      if (interactionMode !== "drag") {
        return;
      }

      event.preventDefault();
      event.originalEvent.dataTransfer.dropEffect = "move";
    });

    $books.on("dragleave", ".book-images", function() {
      if (interactionMode !== "drag") {
        return;
      }

      $(this).removeClass("drop-target");
    });

    $books.on("drop", ".book-images", function(event) {
      if (interactionMode !== "drag") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      $(this).removeClass("drop-target");

      if (!draggedElement || draggedElement === this) {
        return;
      }

      var $dragged = $(draggedElement);
      var $target = $(this);

      if ($dragged.index() < $target.index()) {
        $target.after($dragged);
      } else {
        $target.before($dragged);
      }

      scheduleBookArrangement();
    });

    $books.on("dragover", function(event) {
      if (interactionMode !== "drag") {
        return;
      }

      event.preventDefault();
      event.originalEvent.dataTransfer.dropEffect = "move";
    });

    $books.on("drop", function(event) {
      if (interactionMode !== "drag") {
        return;
      }

      event.preventDefault();

      if (!draggedElement) {
        return;
      }

      if (event.target === this) {
        $(this).append(draggedElement);
        scheduleBookArrangement();
      }
    });
  }

  applyLayout();
  applyInteractionMode();
  applyTheme();
  scheduleBookArrangement();

  $(window).on("resize", handleWindowResize);

  // Keep controls accessible for keyboard navigation when opened via focus.
  $menuToggle.on("focusout", function(event) {
    if ($bottomMenu.has(event.relatedTarget).length === 0) {
      closeLayoutMenu();
    }
  });

  $layoutControls.on("focusout", function(event) {
    if ($bottomMenu.has(event.relatedTarget).length === 0) {
      closeLayoutMenu();
    }
  });
});
