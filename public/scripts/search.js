$('#course-search').on('input', function() {
  var search = $(this).serialize();
  if(search === "search=") {
    search = "all"
  }
  $.get('/course?' + search, function(data) {
    $('#course-grid').html('');
    data.forEach(function(course) {
      $('#course-grid').append(`
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
          <div class="card">
            <img class="card-img-top" src="${ course.image }">
            <div class="card-body">
              <h5 class="card-title">${ course.title }</h5>
              <a href="/course/${ course._id }" class="btn btn-primary">More Info</a>
            </div>
          </div>
        </div>
      `);
    });
  });
});

$('#course-search').submit(function(event) {
  event.preventDefault();
});