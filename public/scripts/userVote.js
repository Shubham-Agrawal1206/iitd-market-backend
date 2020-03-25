$(document).ready(function(){
    $(".vote-up").submit(function(e){
        e.preventDefault();

        var reviewId = $(this).data("id");
        var userId = $(this).data("userid");
        $.ajax({
            type: "PUT",
            url: "/users/" + userId + "/reviews/" + reviewId + "/upvote",
            error: function(err){
                console.log(err);
            },
            success: function(data){
                $.ajax({
                    type: "GET",
                    url: "/users/" + userId + "/reviews/" + reviewId + "/votes",
                    success: function(data){
                        $(`#${reviewId}`).html('')
                        $(`#${reviewId}`).append(data)
                    },
                    error: function(err){
                        console.log(err);
                    }
                })        
            }
        })
            })
    $(".vote-down").submit(function(e){
        e.preventDefault();

        var reviewId = $(this).data("id");
        var userId = $(this).data("userid");
        $.ajax({
            type: "PUT",
            url: "/users/"+ userId + "/reviews/" + reviewId + "/downvote",
            error: function(err){
                console.log(err);
            },
            success: function(data){
                $.ajax({
                    type: "GET",
                    url: "/users/" + userId + "/reviews/" + reviewId + "/votes",
                    success: function(data){
                        $(`#${reviewId}`).html('')
                        $(`#${reviewId}`).append(data)
                    },
                    error: function(err){
                        console.log(err);
                    }
                })        
            }
        })
    })
})