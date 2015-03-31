d3.json("data.json", function(error, json) {
  if (error) return console.warn(error);
  d3.xml("tank-prototype2.svg", "image/svg+xml", function(xml) {
    var importedNode = document.importNode(xml.documentElement, true);
    var data = json.tanks;

    var width =  800,
        height = 600,
        margin = 150;

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

    var svg = d3.select("body").append("svg")
      .attr("width", width + margin*2)
      .attr("height", height + margin*2);
      //.append('g')
      //.attr('transform', 'translate('+margin+','+margin+')');

    svg.selectAll("g")
      .data(data)
      .enter()
      .append("g")
      .attr("transform", function(d, i){ 
        //console.log(d);
        return "translate(" + scale_velocity(d.velocity) + "," 
        + scale_damage(d.damage) + ")"
        +"scale("+ 0.3 +")";
      })
      .each(function(d, i){ 
        var plane = this.appendChild(importedNode.cloneNode(true)); 
        d3.select(plane).select("#turret_side1").attr("fill", scale_armor(d.armor.turret_side)).attr('style', '');
        d3.select(plane).select("#turret_side2").attr("fill", scale_armor(d.armor.turret_side)).attr('style', '');
        d3.select(plane).select("#turret_front").attr("fill", scale_armor(d.armor.turret_front)).attr('style', '');
        d3.select(plane).select("#turret_rear").attr("fill", scale_armor(d.armor.turret_rear)).attr('style', '');
        d3.select(plane).select("#hull_side1").attr("fill", scale_armor(d.armor.hull_side)).attr('style', '');
        d3.select(plane).select("#hull_side2").attr("fill", scale_armor(d.armor.hull_side)).attr('style', '');
        d3.select(plane).select("#hull_front").attr("fill", scale_armor(d.armor.hull_front)).attr('style', '');
        d3.select(plane).select("#hull_rear").attr("fill", scale_armor(d.armor.hull_rear)).attr('style', '');
      });

  });
});
