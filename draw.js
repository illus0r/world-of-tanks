// Ivan Dianov
// for http://datalaboratory.ru/
//
// World of Tanks
// interactive visualisation of tank parameters
//
// April 2015

var width =  1357, // w & h of scatterplot
    height = 811,
    margins =  [1, 1, 42, 42], // top, rifght, bottom, left
    // paddings inside scatterplot
    paddings = [100,100, 100,100]; // top, rifght, bottom, left

// data for radios
var filters = { 
  level: [
    {name:'I', value:'I'},
    {name:'II', value:'II'},
    {name:'III', value:'III'},
    {name:'IV', value:'IV'},
    {name:'V', value:'V'},
    {name:'VI', value:'VI'},
    {name:'VII', value:'VII'},
    {name:'VIII', value:'VIII'},
    {name:'IX', value:'IX'},
    {name:'X', value:'X'}],
  country: [
    {name:'ussr', value:'СССР'},
    {name:'germany', value:'ГЕР'},
    {name:'us', value:'США'},
    {name:'gb', value:'БРИТ'}],
  weight: [
    {name:'light', value:'Лёгкие'},
    {name:'middle', value:'Средние'},
    {name:'heavy', value:'Тяжёлые'},
    {name:'spg', value:'ПТ-САУ'}]
}

var tankssvg_scale = 0.6;
// in raw svg file all models are offseted for some reason. Fixing it.
var tankssvg_offset = [-280, -250].map( function(d) { return d * tankssvg_scale; });

//formats detailed info of tank
function get_details_text(d){
  var html = 
    '<h2>'+d.model+'</h2>'+
    '<table>'+
      '<tr>'+
        '<td>Скорость, км/ч</td>'+
        '<td>'+d.velocity+'</td>'+
        '<td></td>'+
      '</tr>'+
      '<tr>'+
        '<td>Урон за 10 сек., у.е.</td>'+
        '<td>'+d.damage+'</td>'+
        '<td></td>'+
      '</tr>'+
      '<tr>'+
        '<td>Прочность, у.е.</td>'+
        '<td>'+d.hit_points+'</td>'+
        '<td></td>'+
      '</tr>'+
      '<tr>'+
        '<td colspan=3><b>Броня, у.е.</b></td>'+
      '</tr>'+
      '<tr>'+
        '<td>Лоб</td>'+
        '<td>'+d.armor[0]+'</td>'+
        '<td></td>'+
      '</tr>'+
      '<tr>'+
        '<td>Борт</td>'+
        '<td>'+d.armor[2]+'</td>'+
        '<td></td>'+
      '</tr>'+
      '<tr>'+
        '<td>Корма</td>'+
        '<td>'+d.armor[1]+'</td>'+
        '<td></td>'+
      '</tr>'+
      '<tr>'+
        '<td>Лоб башни</td>'+
        '<td>'+d.armor[3]+'</td>'+
        '<td></td>'+
      '</tr>'+
      '<tr>'+
        '<td>Борт башни</td>'+
        '<td>'+d.armor[5]+'</td>'+
        '<td></td>'+
      '</tr>'+
      '<tr>'+
        '<td>Корма башни</td>'+
        '<td>'+d.armor[4]+'</td>'+
        '<td></td>'+
      '</tr>'+
    '</table>'+
    '<div class="image-placeholder"></div>'
  return html;
}

// puts element in top of siblings
d3.selection.prototype.move_to_front = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

// if scale extent = 0 (for example [120, 120]) we expand it
function uncollapse_extent(extent){
  if (extent[0] != extent[1]){
    return extent;
  }
  else{
    return [extent[0]-100, extent[0]+100];
  }
}

$(document).ready(function() {
  // loading tank data
  d3.csv("data.csv", function(error, csv) {
    if (error) return console.warn(error);
    // loading svg containing all tank images
    d3.xml("img/svg/universal.svg", "image/svg+xml", function(xml) {
      var raw_svg = document.importNode(xml.documentElement, true);

      // preparing data
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

      var scale_velocity, scale_damage, scale_armor;
      // armor scale doesn't change on time, so setting it beforehand
      // we will find extent of all armor values of all tanks
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
        .range(['#e97654', '#feee88', '#549f4a']);
      var xAxis = d3.svg.axis()
        .orient("bottom"),
        yAxis = d3.svg.axis()
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

      svg.append('rect')
      .attr('id', 'graph-border')
      .attr({
        width: width,
        height: height
      });

      var details = d3.select('body').append('div')
        .attr('class', 'details');

      // moving all tank images from raw svg to <defs>
      //TODO make it in more clever manier
      //
      //first making a copy of whole raw svg
      d3.select('body').each(function(d, i){ 
        this.appendChild(raw_svg.cloneNode(true)); 
      });
      // adding class to all tanks of raw svg
      $('svg:nth-of-type(2)>g').attr('class','tank');
      // moving all tanks to new svg
      svg.append('defs');
      svg.append('g').classed('tanks', true);
      $('svg:nth-of-type(2)>g').detach().appendTo($('svg.scatterplot defs'));
      $('svg:nth-of-type(2)').detach();
      d3.selectAll('g.tank').each( function(d,i) {
        // we will bind data by __data__.model
        // in raw svg model is stored in attribute inkscape:label
        this.__data__ = {model: d3.select(this).attr(':inkscape:label')}
        // compensating offset
        d3.select(this).attr('transform',
                            'translate('+tankssvg_offset[0]+','+tankssvg_offset[1]+') '+
                            'scale('+tankssvg_scale+')');
      } );
      
      var tanksdefs = svg.selectAll('defs>g')
        .data(data, function(d){return d.model;});

      // we make clones of #default tank for each unbound data item...
      tanksdefs
        .enter()
        .call( function(d) {
          var available_models = svg.selectAll('defs>g')[0]
            .map( function(d) {
              return d.__data__.model;
            } );
          var unavailable_models = d[0].filter( function(datum) {
            if (available_models.indexOf(datum.__data__.model) >= 0){
              return false;
            }
            return true;
          } );
          var unique_index = 0;
          unavailable_models.map( function(d) {
            var node = d3.select('#default').node();
            var node_clone = d3.select(node.parentNode.insertBefore(node.cloneNode(true),
                node.nextSibling))
            node_clone[0][0].__data__ = d.__data__;
            node_clone[0][0].id += ++unique_index;
          } );
        } );
      // ...and reloading data
      // to get new clones in
      tanksdefs = svg.selectAll('defs>g')
        .data(data, function(d){return d.model;});

      // making tanks colorful according to armor values
      tanksdefs
        .each(function(d, i){ 
          var armor_parts = ['tf', 'tr', 'ts', 'hf', 'hr', 'hs']
          for (ap in armor_parts){
            d3.select(this).select("[id^='"+armor_parts[ap]+"']")
              .attr("fill", scale_armor(d.armor[ap]))
              .attr('style', '');
          }
        });

      // adding extra to tanks (flag image and model name)
      var tank_extra = tanksdefs.append('g')
        .classed('extra', true);
      tank_extra
        .append("svg:image")
        .attr('width', '20')
        .attr('height', '12')
        .attr("xlink:href", function(d) {
          return "img/icons-flag/"+d.country+".png";
        });
      tank_extra
        .append("text")
        .text( function(d) {
          return d.model;
        } );

      // Axises
      svg.append("g")
        .attr("class", "y axis");
      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")");

      // looks through <defs> for tank with given model
      function get_id_by_model(model){
        var id = 'default';
        d3.selectAll('defs>g').each( function(d) {
          if(d3.select(this)[0][0].__data__.model == model){
            id = d3.select(this).attr('id');
          }
        });
        // should not be reachable
        return id;
      }

      // updates all scales, axises according to updated data
      function update_scale(){
        var extent_velocity = d3.extent(data, function(d) { return d.velocity; });
        var extent_damage   = d3.extent(data, function(d) { return d.damage; });
        scale_velocity = d3.scale.linear()
          .domain(uncollapse_extent(extent_velocity))
          .range([paddings[3], width - paddings[1]]),
        scale_damage = d3.scale.linear()
          .domain(uncollapse_extent(extent_damage))
          .range([height - paddings[2], paddings[0]]);

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
        update_data();
        update_scale();
        var tanks = svg.select('.tanks').selectAll('use')
          .data(data, function(d){return d.model;});
        // enter
        tanks
          .enter()
          .append('use')
          .classed('tank', true)
          .attr('xlink:href', function(d) {
            return '#'+get_id_by_model(d.model);
          });
        // update
        tanks
          .attr('x', function(d){ 
            return scale_velocity(d.velocity);
          })
          .attr('y', function(d){ 
            return scale_damage(d.damage);
          })
          // does not work on enter, so goes for update
          .on("mouseover",function(d){
            var sel = d3.select(this);
            sel.move_to_front();
            details
              .classed('left', d3.select(this).attr('x') < 500)
              .html(get_details_text(d))
              .style({opacity: 1})
              .style({display: 'block'});
          })
          .on("mouseout", function(d) {
            details
              .style({opacity: 0})
              .transition()
              .style({display: 'none'});
          });
        // exit
        tanks
          .exit()
          .attr('opacity', 0)
          .remove();
        tanks.sort( function(a,b) {
          if (a.damage > b.damage)
            return -1;
          return 1;
        } );
      }

      // filters data according to radios states
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
      }

      // making filter radio contros
      // (jQuery UI buttons)
      function init_document(){
        for(i in filters.country) {
          var nam = filters.country[i].name;
          var val = filters.country[i].value;
          $('<input type="checkbox"  id="checkbox-country-'+nam+
              '" name="'+nam+'"><label for="checkbox-country-'+nam+
              '"><img src="img/icons-flag/'+nam+
              '.png" class="flag"></span>'+val+
              '</label>', {
          }).appendTo('#buttonset-country');
        }
        for(i in filters.weight) {
          var nam = filters.weight[i].name;
          var val = filters.weight[i].value;
          $('<input type="checkbox" id="checkbox-weight-'+nam+
              '" name="'+nam+'"><label for="checkbox-weight-'+nam+
              '">'+val+'</label>', {
          }).appendTo('#buttonset-weight');
        }
        for(i in filters.level) {
          var nam = filters.level[i].name;
          var val = filters.level[i].value;
          $('<input type="checkbox" id="checkbox-level-'+nam+
              '" name="'+nam+'"><label for="checkbox-level-'+nam+
              '">'+val+'</label>', {
          }).appendTo('#buttonset-level');
        }
        // setting initial state of radios
        $('#checkbox-country-germany')[0].checked = true;
        $('#checkbox-weight-light')[0].checked = true;
        $('#checkbox-weight-middle')[0].checked = true;
        $('#checkbox-level-IV')[0].checked = true;
        $('#checkbox-level-II')[0].checked = true;
        // making jQuery UI magic
        $('.buttonset').buttonset();
        $('.buttonset').click(function(evt) {
          update_scatterplot();
        });
        // ...and launching instantly!
        $('.buttonset').trigger( "click" );
      }

      init_document();
    });
  });
});
