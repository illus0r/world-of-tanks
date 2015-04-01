var filters = { 
  level: ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"],
  country: ['su', 'ge', 'us', 'gb'],
  weight: ['light', 'middle', 'heavy', 'spg']
}

$(document).ready(function() {
  for(c in filters.country) {
    var val = filters.country[c];
     $('<input type="checkbox" id="checkbox-country-'+val+'"><label for="checkbox-country-'+val+'">'+val+'</label>', {
        //click: function () { alert(this.val()); }
     }).appendTo('#buttonset-country');
  }
  for(w in filters.weight) {
    var val = filters.weight[w];
     $('<input type="checkbox" id="checkbox-weight-'+val+'"><label for="checkbox-weight-'+val+'">'+val+'</label>', {
        //click: function () { alert(this.val()); }
     }).appendTo('#buttonset-weight');
  }
  for(l in filters.level) {
    var val = filters.level[l];
     $('<input type="checkbox" id="checkbox-level-'+val+'"><label for="checkbox-level-'+val+'">'+val+'</label>', {
        //click: function () { alert(this.val()); }
     }).appendTo('#buttonset-level');
  }
  $('.buttonset').buttonset();
});


d3.json("data.json", function(error, json) {
  if (error) return console.warn(error);
  d3.xml("tank-prototype2.svg", "image/svg+xml", function(xml) {
    var importedNode = document.importNode(xml.documentElement, true);
    var data = json.tanks;

    var width =  800, // w & h of graph area
        height = 600,
        margins = [20, 150, 150, 40]; // top, rifght, bottom, left

    var svg = d3.select("body").append("svg")
      .attr("width", width + margins[1] + margins[3])
      .attr("height", height + margins[0] + margins[2])
      .append('g')
      .attr('transform', 'translate('+margins[3]+','+margins[0]+')');

    svg.append('rect')
      .attr('id', 'graph-border')
      .attr({stroke: '#cccccc',
        fill: 'white',
        //'stroke-width': 2,
        width: width,
        height: height
      });

    redraw();

    function redraw(){
        var scale_velocity = d3.scale.linear()
        .domain(d3.extent(data, function(d) { return d.velocity; }))
        .range([0, width]),
        scale_damage = d3.scale.linear()
        .domain(d3.extent(data, function(d) { return d.damage; }))
        .range([height, 0]);
      var armor_values = [];
      for (var i = data.length - 1; i >= 0; i--){
        for (var key in data[i].armor) {
          armor_values.push(data[i].armor[key]);
        }
      }
      //console.log(d3.extent(armor_values));
      scale_armor = d3.scale.linear()
        .domain(d3.extent(armor_values))
        .range(['red','yellow']);

      var xAxis = d3.svg.axis()
        .scale(scale_velocity)
        .orient("bottom"),
        yAxis = d3.svg.axis()
          .scale(scale_damage)
          .orient("left");

      var tanks = svg.selectAll("g")
        .data(data)
        .enter()
        .append("g")
        .attr("transform", function(d, i){ 
          return "translate(" + scale_velocity(d.velocity) + "," 
          + scale_damage(d.damage) + ")";
        })
      tanks
        .append("svg:image")
        .attr('x',0)
        .attr('y',0)
        .attr('width', 16)
        .attr('height', 11)
        .attr("xlink:href", function(d) {
          return "img/icons-flag/"+d.country+".png";
        });
      tanks
        .append("text")
        .text( function(d) {
          return d.model;
        } )
      .classed('flag', true);
      tanks
        .append("g")
        .attr("transform", function(d, i){ 
          return "scale("+ 0.3 +")";
        })
      .each(function(d, i){ 
        var plane = this.appendChild(importedNode.cloneNode(true)); 
        d3.select(plane).select("#turret-side1").attr("fill", scale_armor(d.armor.turret_side)).attr('style', '');
        d3.select(plane).select("#turret-side2").attr("fill", scale_armor(d.armor.turret_side)).attr('style', '');
        d3.select(plane).select("#turret-front").attr("fill", scale_armor(d.armor.turret_front)).attr('style', '');
        d3.select(plane).select("#turret-rear").attr("fill", scale_armor(d.armor.turret_rear)).attr('style', '');
        d3.select(plane).select("#hull-side1").attr("fill", scale_armor(d.armor.hull_side)).attr('style', '');
        d3.select(plane).select("#hull-side2").attr("fill", scale_armor(d.armor.hull_side)).attr('style', '');
        d3.select(plane).select("#hull-front").attr("fill", scale_armor(d.armor.hull_front)).attr('style', '');
        d3.select(plane).select("#hull-rear").attr("fill", scale_armor(d.armor.hull_rear)).attr('style', '');
      });

      svg.append("g")
        .attr("transform", "translate(0,"+height+")")
        .call(xAxis);
      svg.append("g")
        .attr("transform", "translate(0,0)")
        .call(yAxis);

      }

      $(".buttonset").click(function() {
        //get list of toggles values
        //var items = $(this).buttonset("option", "items");
        var items = $(".buttonset :checked + label").text();
        //console.log(items);

        //refilter data
        //if (['a', 'b', 'c'].indexOf(str) >= 0) {
          ////do something
        //}
        redraw();
      });

  });
});


