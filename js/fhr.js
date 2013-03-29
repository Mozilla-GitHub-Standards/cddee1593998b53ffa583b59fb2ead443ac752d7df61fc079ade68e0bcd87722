$(function() {
    var navListItems = $('.nav li'),
        rawTabs = $('.raw-tabs li a'),
        navItems = navListItems.find('a'),
        contentContainers = $('.outerContainer'),
        rawContentContainers = $('.rawdata-display');

    var showContainer = function(anchor) {
        // Get the id of the container to show from the href.
        var containerId = anchor.attr('href'),
            container = document.querySelector(containerId);
        // Because we are working with flex containers,
        // we cannot simply use jQuery's show as it will set
        // the box to display:block and we want display:flex
        container.setAttribute('style', 'display:flex');
    };

    // Handle clicks on the main presistent header
    navItems.click(function(event) {
        event.preventDefault();
        // Ensure all content containers are hidden.
        contentContainers.hide();
        // Remove the active class from all links
        navListItems.removeClass('active');
        // Set the clicked links parent list item to active
        $(this).parents('li').addClass('active');

        showContainer($(this));
    });

    // Handle tab clicks on the raw data view
    rawTabs.click(function(event) {
        event.preventDefault();
        // Ensure all content containers are hidden.
        rawContentContainers.hide();

        // Deactivate all tabs
        rawTabs.removeClass('active');
        // Set the clicked anchor to active
        $(this).addClass('active');

        showContainer($(this));
    });

    // Lightbox
    $('#my_report').click(function() {
        $('.lightbox').fadeOut('slow');
    });

    // Tip Boxes
    // Handle close button clicks on tip boxes
    $(".closeTip").mouseup(function() {
        var tipBox = $(this).parent();
        tipBox.toggleClass("close");

        // When the transition completed, hide the element
        tipBox[0].addEventListener('transitionend', function() {
            tipBox.addClass("hide");
        });
    });

    // Collapse and Expand Tip Box
    $(".tipBox-header").click(function() {
        var tipboxContent = $(this).next(".tipBox-content");

        tipboxContent.toggleClass("collapse");
        $(this).find(".expanderArrow").toggleClass("collapse");
        tipboxContent.find(".buttonRow").toggleClass("collapse");
    });

    var waitr = 0;
    // Using a self executing function with a setTimeout
    // to ensure we do not attempt to use the payload
    // before it is ready.
    (function waitForPayload() {
        if(payload) {
            showTipboxes();
            return;
        }
        waitr = setTimeout(waitForPayload, 500);
    })();

    var drawGraph = function() {

        var startupTimes = getAllStartupTimes(),
            startupTimesLength = startupTimes.length,
            graphData = [],
            options = {
                colors: ['#50B432'],
                series: {
                    lines: {
                        show: true,
                        fill: true,
                        fillColor: "rgba(237, 236, 236, 0.8)"
                    },
                    points: {
                        show: true,
                        radius: 5
                    }
                },
                xaxis: {
                    show: false
                }
            };

        for(var i = 0; i < startupTimesLength; i++) {
            // Push the index and the value
            graphData.push([i, startupTimes[i]]);
        }

        var graphContainer = $('.graph'),
            graph = $.plot(graphContainer, [graphData], options);
    };

    // Conditionally show tip boxes
    function showTipboxes() {
        clearTimeout(waitr);

        // User has a crashy browser
        if(getTotalNumberOfCrashes('week') > 5) {
            $('#crashyfox').show('slow');
        }

        // We need at least 5 sessions with data
        if(getSessionsCount() < 5) {
            $('#hungryfox').show('slow');
        } else {
            // We have enough data, draw the graph
            drawGraph();
        }

        // If our median startup time is greater than 20,
        // we have a slowfox
        if(calculateMedianStartupTime() > 20) {
            $('#slowfox').show('slow');
        }
    }
});
