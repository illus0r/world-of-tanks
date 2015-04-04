var filters = { 
  level: ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"],
  country: ['ussr', 'germany', 'us', 'gb'],
  weight: ['light', 'middle', 'heavy', 'spg']
}

var tanks_svg_offset = [-100, -100];

$(document).ready(function() {
  d3.csv("data.csv", function(error, csv) {
    if (error) return console.warn(error);
    d3.xml("img/svg/universal.svg", "image/svg+xml", function(xml) {
      var tanks_svg = document.importNode(xml.documentElement, true);

      csv = csv.map( function(d) {
        delete d.armorhf;
        delete d.armorhr;
        delete d.armorhs;
        delete d.armortf;
        delete d.armortr;
        delete d.armorts;
        d.armor = d.armor.split('/');
        d.damage = +d.damage;
        return d;
      } )
      var data = csv;

      var width =  800, // w & h of graph area
          height = 600,
          margins = [20, 150, 150, 40]; // top, rifght, bottom, left

      var scale_velocity, scale_damage, scale_armor;
      var armor_values = [];
      for (var i = data.length - 1; i >= 0; i--){
        for (var key in data[i].armor) {
          armor_values.push(data[i].armor[key]);
        }
      }
      var scale_armor_extent = d3.extent(armor_values);
      scale_armor = d3.scale.linear()
        //TODO rewrite
        .domain([scale_armor_extent[0], scale_armor_extent[0]/2+scale_armor_extent[1]/2, scale_armor_extent[1]])
        .range(['orange', 'gold', 'yellowgreen']);
      var xAxis = d3.svg.axis()
        //.scale(scale_velocity)
        .orient("bottom"),
        yAxis = d3.svg.axis()
          //.scale(scale_damage)
          .orient("left");

      //// color legend
      //var colors = d3.scale.quantize()
      //.range(['red', 'white', 'blue', 'green', 'black', 'yellow', 'pink']);
      //var legend = d3.select('#legend')
      //.append('ul')
      //.attr('class', 'list-inline');
      //var keys = legend.selectAll('li.key')
      //.data(colors.range());
      //keys.enter().append('li')
      //.attr('class', 'key')
      //.style('border-top-color', String)
      //.text(function(d) {
      //var r = colors.invertExtent(d);
      //return formats.percent(r[0]);
      //});

      var svg = d3.select("body").append("svg")
        .attr("width", width + margins[1] + margins[3])
        .attr("height", height + margins[0] + margins[2])
        .classed('scatterplot', true)
        .append('g')
        .attr('transform', 'translate('+margins[3]+','+margins[0]+')');

      // g.tanks - обёртка для всех танков на графике
      svg.append('defs');

      svg.append('rect')
      .attr('id', 'graph-border')
      .attr({stroke: '#cccccc',
        fill: 'none',
        //'stroke-width': 2,
        width: width,
        height: height
      });

      // Перенесём все элементы inkscape файла в созданный нами svg
      //TODO сейчас элементы переезжают в svg не оптимальным способом
      d3.select('body').each(function(d, i){ 
        var plane = this.appendChild(tanks_svg.cloneNode(true)); 
      });
      // на старый svg добавляем классы для всех танков, включая default
      // TODO переписать на d3
      $('svg:nth-of-type(2)>g').attr('class','tank');
      // переносим их на новый svg
      $('svg:nth-of-type(2)>g').detach().appendTo($('svg.scatterplot defs'));
      $('svg:nth-of-type(2)').detach();
      d3.selectAll('g.tank').each( function(d,i) {
        // собираемся прикрепить данные по названию модели, поэтому пропишем его в дате
        // TODO переписать через d3 функцию .datum()
        this.__data__ = {model: d3.select(this).attr(':inkscape:label')}
        d3.select(this).attr('transform','');
        // изначально все скрыты, update_scatterplot сделает видимыми нужные
        d3.select(this).attr('opacity',0);
      } );

      svg.append("g")
        .attr("class", "y axis");
      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")");

      function update_scale(){
        scale_velocity = d3.scale.linear()
          .domain(d3.extent(data, function(d) { return d.velocity; }))
          .range([0, width]),
        scale_damage = d3.scale.linear()
          .domain(d3.extent(data, function(d) { return d.damage; }))
          .range([height, 0]);
        //console.log(d3.extent(data, function(d) { return d.damage; }));

        var xAxis_scale = xAxis.scale(scale_velocity);
        var yAxis_scale = yAxis.scale(scale_damage);

        svg.select("g.y.axis")
          .transition().duration(500)
          .call(yAxis);
        svg.select("g.x.axis")
          .transition().duration(500)
          .call(xAxis);
      }

      function update_scatterplot(){
        var tanks = svg.selectAll("g.tank, use.tank")
          .data(data, function(d) { return d.model; });
        // exit
        tanks
          .exit()
          //.transition()
          .attr('opacity', 0);
          //.remove();
        // enter
        var tanks_enter = tanks
          .enter()
          .append("use")
          .attr(':xlink:href','#g6041')
          .attr('opacity',1)
          .attr('transform','transition(10,10)')
          .classed('tank', true);
        tanks_enter
          .append("svg:image")
          .attr('x',0)
          .attr('y',0)
          .attr('width', 16)
          .attr('height', 11)
          .classed('flag', true);
        tanks_enter
          .append("text");
        tanks_enter
          .append("g")
          .attr("transform", function(d, i){
            return "scale("+ 0.5 +")";
          })
        .each(function(d, i){ 
          var plane = this.appendChild(d3.select("[:inkscape:label='default']").cloneNode(true)); 
          d3.select(plane).select("path[id^='tf']").attr("fill", scale_armor(d.armor[0])).attr('style', '');
          d3.select(plane).select("[id^='tr']").attr("fill", scale_armor(d.armor[1])).attr('style', '');
          d3.select(plane).select("[id^='ts']").attr("fill", scale_armor(d.armor[2])).attr('style', '');
          d3.select(plane).select("[id^='hf']").attr("fill", scale_armor(d.armor[3])).attr('style', '');
          d3.select(plane).select("[id^='hr']").attr("fill", scale_armor(d.armor[4])).attr('style', '');
          d3.select(plane).select("[id^='hs']").attr("fill", scale_armor(d.armor[5])).attr('style', '');
        });
        // update
        tanks
          .attr('opacity',0)
          .attr("transform", function(d, i){ 
            return "translate(" + scale_velocity(d.velocity) + "," 
            + scale_damage(d.damage) + ")";
          })
        .transition()
          .attr('opacity',1);
        tanks
          .select("image")
          .attr("xlink:href", function(d) {
            return "img/icons-flag/"+d.country+".png";
          });
        tanks
          .select('text')
          .text( function(d) {
            return d.model;
          } );
      }

      function update_data() {
        var current_filters = {
          level: $.map( $("#buttonset-level :checked"), function(val){
            return val.name;
          }),
          country:  $.map( $("#buttonset-country :checked"), function(val){
            return val.name;
          }),
          weight:  $.map( $("#buttonset-weight :checked"), function(val){
            return val.name;
          })
        };
        data = csv.filter( function(d) {
          if (current_filters.level.indexOf(d.level) >= 0 &&
            current_filters.country.indexOf(d.country) >= 0 &&
            current_filters.weight.indexOf(d.weight) >=0) {
              return true;
            }
          return false;
        });
        //console.log(data);
      }

      function init_document(){
        for(c in filters.country) {
          var val = filters.country[c];
          $('<input type="checkbox"  id="checkbox-country-'+val+'" name="'+val+'"><label for="checkbox-country-'+val+'">'+val+'</label>', {
          }).appendTo('#buttonset-country');
        }
        for(w in filters.weight) {
          var val = filters.weight[w];
          $('<input type="checkbox" id="checkbox-weight-'+val+'" name="'+val+'"><label for="checkbox-weight-'+val+'">'+val+'</label>', {
          }).appendTo('#buttonset-weight');
        }
        for(l in filters.level) {
          var val = filters.level[l];
          $('<input type="checkbox" id="checkbox-level-'+val+
              '" name="'+val+
              '"><label for="checkbox-level-'+val+
              '">'+val+
              '</label>', {
          }).appendTo('#buttonset-level');
        }
        $('#checkbox-country-ussr')[0].checked = true;
        $('#checkbox-country-germany')[0].checked = true;
        $('#checkbox-weight-middle')[0].checked = true;
        $('#checkbox-level-IV')[0].checked = true;
        $('.buttonset').buttonset();
        $('.buttonset').click(function(evt) {
          update_data();
          update_scale();
          update_scatterplot();
        });
        $('.buttonset').trigger( "click" );
      }

      init_document();
    });
  });
});
