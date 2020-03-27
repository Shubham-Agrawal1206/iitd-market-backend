$(document).ready(function(){
    $(".vote-up").submit(function(e){
        e.preventDefault();

        var reviewId = $(this).data("id");
        var courseSlug = $(this).data("courseslug");
        $.ajax({
            type: "PUT",
            url: window.location.origin + "/course/" + courseSlug + "/reviews/" + reviewId + "/upvote",
            success: function(data){
                $.ajax({
                    type: "GET",
                    url: window.location.origin + "/course/" + courseSlug + "/reviews/" + reviewId + "/votes",
                    success: function(data){
                        $(`#${reviewId}`).html('')
                        $(`#${reviewId}`).append(data)
                    },
                    error: function(err){
                        console.log(err);
                    }
                })
            },
            error: function(a,b,c){
                window.location.replace(window.location.origin+a.responseText); 
            }
        })
    })
    $(".vote-down").submit(function(e){
        e.preventDefault();

        var reviewId = $(this).data("id");
        var courseSlug = $(this).data("courseslug");
        $.ajax({
            type: "PUT",
            url: window.location.origin + "/course/"+ courseSlug + "/reviews/" + reviewId + "/downvote",
            success: (data) => {
                $.ajax({
                    type: "GET",
                    url: window.location.origin + "/course/" + courseSlug + "/reviews/" + reviewId + "/votes",
                    success: function(data){
                        $(`#${reviewId}`).html('');
                        $(`#${reviewId}`).append(data)
                    },
                    error: function(err){
                        console.log(err);
                    }
                })
            },
            error: function(a,b,c){
                window.location.replace(window.location.origin+a.responseText);
            }
        })
    })
})