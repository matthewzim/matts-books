new Vue({
  el: "#container",
  data: {
    value: '1',
    books :[]
  },
  created: function () {
    
  },
  methods: {
    setImages:function() {

    }
  },
  computed: {

  },
  mounted() {
    $.getJSON('json/books.json', json => {
      this.books = json
    })
    this.setImages()

  },
  beforeMount() {

  },
  watch: {

  }
})
