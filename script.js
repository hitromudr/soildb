
ymaps.ready(init);

var myPlacemark,
    myMap,
    myCollection;

var page = new Page();

/**
 * Класс страницы.
 **/
function Page () {
    
    self = this;

    this.storedData = {};
    
    // коеффициент надо пересчитать из XML параметров scoeff_min и scoeff_max
    this.scoeff = '1.4|1.3|1|0.7|0.3|0.2|1.2|1.1|1|0.5|0.2|0.2|1.5|1.2|1|0.7|0.5|0.3|1.3|1.1'
                           + '|1|0.5|0.3|0.2|1|1|1|0.3|0|0|1.5|1.3|1|0.7|0.5|0.3|';

    /**
     * Загрузка данных поля.
    **/
    this.load_RSS = function () {
        var title;
        var doc_root;
        var doc_channel;
        var polygon_node;
        var soil_node;
        var sHTML = 'нет объектов в зоне выбора';
        var t_string;

        //var url = "https://gis.soil.msu.ru/soil_db/fertilizers/GEORSSHandler_Field.ashx?Latitude=";
        var url = " http://db.soil.msu.ru/fertilizers/GEORSSHandler_Field.ashx?Latitude=";
        var refer = url + Latitude.value + "&longitude=" + Longitude.value;
        self.loadParameters(refer, parseRSSParameters);
    }

    /**
     * Разобрать данные RSS.
     **/
    function parseRSSParameters(xml) {
        ///// parse and display Description
        if ($(xml).find('item').length > 0) {
            var doc_item;
            if ($(xml).find('Полигоны_агрохимического_обследования').length > 0) {
                createTable(xml);
                self.calculate();
            }
            document.getElementById('for_test').innerHTML = t_string;
            parseGeography(xml);
        }
    }

    /**
     * Создать таблицу ответа из данных RSS.
     **/
    function createTable(xml) {
        doc_item = $(xml).find('Полигоны_агрохимического_обследования')[0];
        t_string = '<table border="1" align="center">';
        for (var i = 0; i < doc_item.childNodes[0].childNodes.length; i++)
            t_string = t_string + '<tr><td>' + doc_item.childNodes[0].childNodes[i].nodeName + '</td><td>'
                     + doc_item.childNodes[0].childNodes[i].childNodes[0].nodeValue + '</td></tr>';

        iDistrict.value = $(xml).find('item').find('Район').text();
        iP.value = $(xml).find('item').find('Фосфор').text();
        iK.value = $(xml).find('item').find('Калий').text();

        t_string = t_string + '</table>';
    }

    /**
     * parse Geography
    **/
    function parseGeography(xml) {
        polygon_node = $(xml).find('item')[0].childNodes[4].childNodes[0].childNodes[0].childNodes[0].childNodes[0];
        if (polygon_node.xml) {
            // Converts the xml object to string  (  For IE)
            t_string = polygon_node.nodeValue;
        } else {
            // Converts the xml object to string (For rest browsers, mozilla, etc)
            t_string = new XMLSerializer().serializeToString(polygon_node);
        }

        var arr_a = t_string.split('>')[1];
        var arr_c = arr_a.split('<')[0];
        arr_a = arr_c.split(' ');
        var t;
        var arr_b = [['1', '2'], ['3', '4']];

        for (var i = 0; i < arr_a.length / 2; i++) {
            t = arr_a[i * 2] + ',' + arr_a[i * 2 + 1];
            arr_b[i] = t.split(',');
        }

        var myPolygon1 = new ymaps.GeoObject({
                geometry: {
                    type: "Polygon",
                    coordinates: [arr_b]
                },
                properties: {hintContent: "Многоугольник"}
            },
            {
                interactivityModel: 'default#transparent',
                fillColor: '#7df9ff33',
                opacity: 0.5,
                strokeColor: '#FF0000',
                strokeOpacity: 0.5, strokeWidth: 2
            });

        myCollection.add(myPolygon1);
        myMap.geoObjects.add(myCollection);
    }

    /**
     * Рассчет удобрений.
    **/
    this.calculate = function () {
        var cropSelect = document.getElementById("crop_select");
        iCrop_group.value = self.aCrop_Groups_id[cropSelect.options[cropSelect.selectedIndex].value];
        iZone_Kod.value=0;
        iZone.value='Область';

        for (var i = 0; i < self.aDistrict.length - 1; i++)
            if (iDistrict.value == self.aDistrict[i]) {
                iZone_Kod.value = self.aZone_id[i];
                iZone.value = self.aZone[i];
        }

        iPk.value = 'не определено';
        iKk.value = 'не определено';
        iK_P.value=0;
        iK_K.value=0;

        for (var i = 0; i < self.aId.length - 1; i++) {
            if ((self.anutrition[i] == 'Фосфорные удобрения')
                && (iP.value > self.acontent_min[i])
                && (iP.value <= self.acontent_max[i])
                && (self.acrop_group[i] == iCrop_group.value)) {
                    iPk.value = self.aclass_name[i];
                    iK_P.value = parseFloat(self.acoeff[i]).toFixed(2);
            }
            if ((self.anutrition[i] == 'Калийные удобрения')
                && (iK.value > self.acontent_min[i])
                && (iK.value <= self.acontent_max[i])
                && (self.acrop_group[i] == iCrop_group.value)) {
                    iKk.value = self.aclass_name[i];
                    iK_K.value = parseFloat(self.acoeff[i]).toFixed(2);
            }
        }

        iHN.value=0;
        iHP.value=0;
        iHK.value=0;

        for (var i = 0; i < self.aN_Id.length - 1; i++) {
            if ((iZone_Kod.value == self.aN_Zone[i])
                && (self.aN_Nutrition_element[i] == 'N')
                && (self.aN_crop_id[i] == cropSelect.options[cropSelect.selectedIndex].value))
                    iHN.value = parseFloat(self.aN_Norma[i]).toFixed(2);
            if ((iZone_Kod.value == self.aN_Zone[i])
                && (self.aN_Nutrition_element[i] == 'P_2_O_5')
                && (self.aN_crop_id[i] == cropSelect.options[cropSelect.selectedIndex].value))
                    iHP.value = parseFloat(self.aN_Norma[i]).toFixed(2);
            if ((iZone_Kod.value == self.aN_Zone[i])
                && (self.aN_Nutrition_element[i] == 'K_2_O')
                && (self.aN_crop_id[i] == cropSelect.options[cropSelect.selectedIndex].value))
                    iHK.value = parseFloat(self.aN_Norma[i]).toFixed(2);
        }

        var Ur = document.getElementById("Ur");
        iDn.value = (iHN.value * parseInt(Ur.options[Ur.selectedIndex].value) * 10).toFixed(2);
        iDp.value = (iHP.value * parseInt(Ur.options[Ur.selectedIndex].value) * 10 * iK_P.value).toFixed(2);
        iDk.value = (iHK.value * parseInt(Ur.options[Ur.selectedIndex].value) * 10 * iK_K.value).toFixed(2);
    }

    /**
     * Загрузка XML-документа с описанями.
    **/
    this.loadParameters = function (url, onSuccess) {
        var url = url || 'http://db.soil.msu.ru/fertilizers/GEORSSHandler_Fertilizers_parameters.ashx?method=Get_Start_Parameters';

        $.ajax({
            type: 'get',
            dataType: 'xml',
            url: url,
            success: onSuccess || parseParameters
        });
    }

    /**
     * Разбор XML-документа в массивы.
     */
    function parseParameters (xml) {

        // Параметры.
        var xmlParameters = getXMLParameters();
        // Пройтись по разделам параметров.
        for (var section in xmlParameters) {

            // Это не раздел.
            if (!xmlParameters.hasOwnProperty(section)) {
                continue;
            }

            // Найти в XML разделы по имени тега и перебрать их.
            $(xml).find(section).each(function (key, val) {

                // Пройтись по параметрам раздела.
                for (var i = 0; i < xmlParameters[section].length; i++) {

                    // Имя и значение параметра.
                    var parameterName = section + '_' + xmlParameters[section][i],
                        parameterValue = $(val).find(xmlParameters[section][i]).text();

                    if (!self.storedData[parameterName]) {
                        self.storedData[parameterName] = [];
                    }
                    // Добавить значение в массив параметра.
                    self.storedData[parameterName].push(parameterValue);
                }
            });
        }

        initialize();
    }

    /**
     * Инициализация переменных.
     **/
    function initialize () {
      self.aId = self.storedData.class_coefficients_Id;
      self.aclass = self.storedData.class_coefficients_class;
      self.aclass_name = self.storedData.class_coefficients_class_name;
      self.anutrition = self.storedData.class_coefficients_nutrition;
      self.acontent_min = self.storedData.class_coefficients_content_min;
      self.acontent_max = self.storedData.class_coefficients_content_max;
      self.acrop_group = self.storedData.class_coefficients_crop_group;
      self.acoeff = self.scoeff.split("|");

      self.aN_Id = self.storedData.Normatives_Id;
      self.aN_crop_id = self.storedData.Normatives_crop_id;
      self.aN_Crop = self.storedData.Normatives_Crop;
      self.aN_Nutrition_element = self.storedData.Normatives_Nutrition_element;
      self.aN_Zone = self.storedData.Normatives_Zone;
      self.aN_Norma = self.storedData.Normatives_Norma;

      self.aZone = self.storedData['districts_Природно_x0020_экономические_x0020_зоны_x0020_Ростовский_x0020_области'];
      self.aZone_id = self.storedData['districts_код'];
      self.aDistrict = self.storedData['districts_район'];

      self.aCrop_Groups_id = self.storedData.crops_Crop_group;
      self.aCrop_Names = self.storedData.crops_Crop_Name;
      self.aCrops_id = self.storedData.crops_Id;
        // дебаг объекта
        console.log(self.storedData);

        fillComboBox("crop_select");
    }

    /**
     * Наполнение выпадающего списка "Культура"
     **/
    function fillComboBox(comboBoxName) {
        for (var i = 0; i < self.aCrops_id.length - 1; i++) {
            var oOption = document.createElement("OPTION");
            oOption.text = self.aCrop_Names[i];
            oOption.value = self.aCrops_id[i];
            document.getElementById(comboBoxName).options.add(oOption);
        }
        document.getElementById(comboBoxName).selectedIndex = 0;
    }

    /**
     * Загрузка списка разделов и параметров XML-документа.
     */
    function getXMLParameters() {

        return {
            crops: [
                'Id',
                'Crop_Name',
                'Crop_group'
            ],

            Normatives: [
                'Id',
                'crop_id',
                'Crop',
                'Nutrition_element',
                'Zone',
                'Norma'
            ],

            class_coefficients: [
                'Id',
                'class',
                'class_name',
                'nutrition',
                'content_min',
                'content_max',
                'crop_group',
                'coeff_min',
                'coeff_max'
            ],

            districts: [
                'Природно_x0020_экономические_x0020_зоны_x0020_Ростовский_x0020_области',
                'район',
                'код'
            ],
        };
    }
}

/**
 * Инициализация карты.
**/
function init() {
	var coords = [47.55, 38.7];

    myMap = new ymaps.Map('myMap', {
		center: [47.55, 38.7],
		zoom: 	 12
	});

    myPlacemark = createPlacemark(coords);
	myMap.geoObjects.add(myPlacemark);

	// Слушаем событие окончания перетаскивания на метке.
    myPlacemark.events.add('dragend', function() {
		coords = myPlacemark.geometry.getCoordinates();
        Latitude.value = coords[0].toPrecision(6);
        Longitude.value = coords[1].toPrecision(6);
	});

	myMap.events.add('click', function(e) {
	    var coords = e.get('coords');
        Latitude.value = coords[0].toPrecision(6);
        Longitude.value = coords[1].toPrecision(6);
	    // Если метка уже создана – просто передвигаем ее.
	    if (myPlacemark) myPlacemark.geometry.setCoordinates(coords);
	});

	myMap.setType('yandex#hybrid');
	myCollection = new ymaps.GeoObjectCollection({}, { preset: 'islands#redIcon' });
}

/**
 * Создание метки на карте.
**/
function createPlacemark(coords) {
	return new ymaps.Placemark(coords, {
		iconCaption: 'можно тащить'
	}, {
		preset: 'islands#violetDotIconWithCaption',
		draggable: true
	});
}

/**
 * Точка входа.
**/
(function ($, Drupal, data, document) {

  'use strict';

  // To understand behaviors, see https://drupal.org/node/756722#behaviors
  Drupal.behaviors.my_custom_behavior = {
    attach: function (context, settings) {

        // Place your code here.
        page.loadParameters();
    }
  };

})(jQuery, Drupal, this, this.document);





