$(document).ready(function() {
  const $books = $("#books");
  const $booksView = $("#books-view");
  const $layoutControls = $("#layout-controls");
  const $bottomMenu = $("#bottom-menu");
  const $menuToggle = $("#layout-menu-toggle");
  const $themeToggle = $("#theme-toggle");
  const $rowToggle = $("#row-toggle");
  const $interactionToggle = $("#interaction-toggle");
  const rootElement = document.documentElement;
  const BASE_SCALE = 1.25;
  const MIN_VARIATION = 0.9;
  const MAX_VARIATION = 1.1;
  const OVERFLOW_END_CLASS = "is-at-end";
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

    arrangementFrameId = window.requestAnimationFrame(applyWrapLayout);
  }

  function updateOverflowBorderState() {
    const element = $booksView.get(0);

    if (!element) {
      return;
    }

    if ($rowToggle.val() !== "overflow") {
      $booksView.removeClass(OVERFLOW_END_CLASS);
      return;
    }

    const maxScrollLeft = Math.max(element.scrollWidth - element.clientWidth, 0);
    const threshold = 1;
    const isAtEnd =
      maxScrollLeft <= threshold || element.scrollLeft >= maxScrollLeft - threshold;

    $booksView.toggleClass(OVERFLOW_END_CLASS, isAtEnd);
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

  function applyWrapLayout() {
    arrangementFrameId = null;

    const rowMode = $rowToggle.val();
    const $items = $books.children(".book-images");
    const booksElement = $books.get(0);

    if (!booksElement) {
      updateOverflowBorderState();
      return;
    }

    if (!$items.length) {
      booksElement.style.width = "";
      booksElement.style.height = "";
      updateOverflowBorderState();
      return;
    }

    clearBookPlacement($items);

    const shouldArrange = rowMode === "wrap";

    if (!shouldArrange) {
      booksElement.style.width = "";
      booksElement.style.height = "";
      updateOverflowBorderState();
      return;
    }

    const availableWidth = $booksView.innerWidth();

    if (!availableWidth) {
      booksElement.style.width = "";
      booksElement.style.height = "";
      updateOverflowBorderState();
      return;
    }

    const computedStyle = window.getComputedStyle(booksElement);
    const columnGapValue = parseFloat(computedStyle.columnGap);
    const columnGap = Number.isFinite(columnGapValue) ? columnGapValue : 0;
    const rowGapValue = parseFloat(computedStyle.rowGap);
    const rowGap = Number.isFinite(rowGapValue) ? rowGapValue : 0;

    const rows = [];
    let currentRowItems = [];
    let currentLeft = 0;
    let maxRowHeight = 0;

    function finalizeRow() {
      if (!currentRowItems.length) {
        return;
      }

      rows.push({
        items: currentRowItems,
        height: maxRowHeight,
        width: currentLeft,
      });

      currentRowItems = [];
      currentLeft = 0;
      maxRowHeight = 0;
    }

    $items.each(function() {
      const element = this;
      const $element = $(element);
      const elementWidth = Math.ceil($element.outerWidth(true)) || 0;
      const elementHeight = Math.ceil($element.outerHeight(true)) || 0;

      let nextLeft = currentRowItems.length ? currentLeft + columnGap : 0;
      let predictedWidth = nextLeft + elementWidth;

      if (
        currentRowItems.length &&
        availableWidth &&
        predictedWidth > availableWidth
      ) {
        finalizeRow();
        nextLeft = 0;
        predictedWidth = elementWidth;
      }

      currentRowItems.push({
        element,
        width: elementWidth,
        height: elementHeight,
        left: nextLeft,
      });

      currentLeft = predictedWidth;

      if (elementHeight > maxRowHeight) {
        maxRowHeight = elementHeight;
      }
    });

    finalizeRow();

    if (!rows.length) {
      booksElement.style.width = "";
      booksElement.style.height = "";
      updateOverflowBorderState();
      return;
    }

    let contentHeight = 0;
    let maxRowWidth = 0;

    rows.forEach(function(row, rowIndex) {
      if (row.width > maxRowWidth) {
        maxRowWidth = row.width;
      }

      const baseTop = contentHeight;

      row.items.forEach(function(item) {
        const offset = row.height - item.height;
        const topPosition = baseTop + (offset > 0 ? offset : 0);

        item.element.style.position = "absolute";
        item.element.style.left = item.left + "px";
        item.element.style.top = topPosition + "px";
      });

      contentHeight += row.height;

      if (rowIndex < rows.length - 1) {
        contentHeight += rowGap;
      }
    });

    booksElement.style.width = maxRowWidth ? maxRowWidth + "px" : "";
    booksElement.style.height = contentHeight ? contentHeight + "px" : "";
    updateOverflowBorderState();
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
    $books
      .removeClass("layout-overflow layout-wrap orientation-horizontal")
      .addClass(rowMode === "wrap" ? "layout-wrap" : "layout-overflow")
      .addClass("orientation-horizontal");

    $booksView
      .removeClass("scroll-horizontal view-overflow view-wrap")
      .addClass("scroll-horizontal")
      .addClass(rowMode === "overflow" ? "view-overflow" : "view-wrap");

    updateOverflowBorderState();
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
    updateOverflowBorderState();
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

  $booksView.on("scroll", updateOverflowBorderState);

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
