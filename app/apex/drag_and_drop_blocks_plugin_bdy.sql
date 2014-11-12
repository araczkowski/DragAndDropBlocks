create or replace PACKAGE body drag_and_drop_blocks_plugin
IS
  FUNCTION render(
      p_region              IN apex_plugin.t_region,
      p_plugin              IN apex_plugin.t_plugin,
      p_is_printer_friendly IN BOOLEAN)
    RETURN apex_plugin.t_region_render_result
  IS
    -- Component attributes
    l_min apex_application_page_regions.attribute_01%type                 := COALESCE(p_region.attribute_01, '0');
    l_max apex_application_page_regions.attribute_02%type                 := COALESCE(p_region.attribute_02, '1440');
    l_step apex_application_page_regions.attribute_03%type                := COALESCE(p_region.attribute_03, 30);
    l_toolbarId apex_application_page_regions.attribute_04%type           := COALESCE(p_region.attribute_04, 'toolbar1');
    l_blocksToolbar apex_application_page_regions.attribute_05%type       := COALESCE(p_region.attribute_05, '[]');
    l_stepLabelDispFormat apex_application_page_regions.attribute_07%type := p_region.attribute_07;
    --
    l_elementId apex_application_page_regions.attribute_08%type      := p_region.attribute_08;
    l_first_instance apex_application_page_regions.attribute_09%type := COALESCE(p_region.attribute_09, 'Y');
    l_options JSON                                                   := json();
    l_blocks JSON_LIST                                               := json_list();
    l_block JSON                                                     := json();
    retval apex_plugin.t_region_render_result;
    -- test data
    l_open_blocks VARCHAR2(4000);
  BEGIN
    IF apex_application.g_debug THEN
      apex_plugin_util.debug_region(p_plugin => p_plugin, p_region => p_region);
    END IF;
    -- load the css and js only for first plugin instance
    IF l_first_instance = 'Y' THEN
      -- CSS files
      apex_css.add_file(p_name => 'vendor', p_directory => p_plugin.file_prefix);
      apex_css.add_file(p_name => 'main', p_directory => p_plugin.file_prefix);
      -- JS files
      apex_javascript.add_library(p_name => 'vendor', p_directory => p_plugin.file_prefix, p_version => NULL);
      apex_javascript.add_library(p_name => 'main', p_directory => p_plugin.file_prefix, p_version => NULL);
    END IF;
    -- html part
    sys.htp.p('<script>var ' || l_elementId || '</script>');
    sys.htp.p('<div id="content-' || l_elementId || '" class="content"><div id="' || l_elementId || '"></div></div>');
    --  plugin inicialization
    l_options.put(pair_name => 'min', pair_value => l_min);
    l_options.put(pair_name => 'max', pair_value => l_max);
    l_options.put(pair_name => 'step', pair_value => l_step);
    l_options.put(pair_name => 'toolbarId', pair_value => l_toolbarId);
    --
    IF l_toolbarId = 'toolbar1' THEN
      FOR rec IN
      (SELECT * FROM pgipar_blocks WHERE PAR_BLO_TYPE = 'GS'
      )
      LOOP
        l_block.put(pair_name => 'blockId', pair_value => rec.PAR_BLO_ID);
        l_block.put(pair_name => 'code', pair_value => rec.PAR_BLO_CODE);
        l_block.put(pair_name => 'name', pair_value => rec.PAR_BLO_NAME);
        l_block.put(pair_name => 'value', pair_value => rec.PAR_BLO_VALUE);
        l_block.put(pair_name => 'colort', pair_value => rec.PAR_BLO_COLOR_T);
        l_block.put(pair_name => 'colorp', pair_value => rec.PAR_BLO_COLOR_P);
        l_block.put(pair_name => 'coloru', pair_value => rec.PAR_BLO_COLOR_U);
        l_blocks.append(l_block.to_json_value);
      END LOOP;
      l_options.put(pair_name => 'blocksToolbar', pair_value => l_blocks.to_char(false));
    elsif l_toolbarId = 'toolbar2' THEN
      FOR rec IN
      (SELECT * FROM pgipar_blocks WHERE PAR_BLO_TYPE = 'GM'
      )
      LOOP
        l_block.put(pair_name => 'blockId', pair_value => rec.PAR_BLO_ID);
        l_block.put(pair_name => 'code', pair_value => rec.PAR_BLO_CODE);
        l_block.put(pair_name => 'name', pair_value => rec.PAR_BLO_NAME);
        l_block.put(pair_name => 'value', pair_value => rec.PAR_BLO_VALUE);
        l_block.put(pair_name => 'colort', pair_value => rec.PAR_BLO_COLOR_T);
        l_block.put(pair_name => 'colorp', pair_value => rec.PAR_BLO_COLOR_P);
        l_block.put(pair_name => 'coloru', pair_value => rec.PAR_BLO_COLOR_U);
        l_blocks.append(l_block.to_json_value);
      END LOOP;
      l_options.put(pair_name => 'blocksToolbar', pair_value => l_blocks.to_char(false));
    ELSE
      l_options.put(pair_name => 'blocksToolbar', pair_value => '[]');
    END IF;
    /*l_options.put(pair_name  => 'stepLabelDispFormat',
    pair_value => l_stepLabelDispFormat);*/
    --
    IF l_elementId = 'dadb1' THEN
      FOR rec IN
      (SELECT  *
      FROM PGIPAR_RANGES r
      WHERE r.PAR_RAN_DAY_MON = 'Y'
      AND r.PAR_RAN_DAY_WED   = 'Y'
      AND r.PAR_RAN_DAY_FRI   = 'Y'
      AND r.PAR_RAN_VACATION != 'Y'
      )
      LOOP
        IF l_open_blocks IS NOT NULL THEN
          l_open_blocks  := l_open_blocks ||',';
        END IF;
        l_open_blocks := l_open_blocks || '['||rec.PAR_RAN_OPEN_FROM ||','|| (rec.PAR_RAN_OPEN_TO - rec.PAR_RAN_OPEN_FROM)||','||rec.par_ran_id ||']';
      END LOOP;
    ELSIF l_elementId = 'dadb2' THEN
      FOR rec IN
      (SELECT  *
      FROM PGIPAR_RANGES r
      WHERE r.PAR_RAN_DAY_TUE = 'Y'
      AND r.PAR_RAN_DAY_THU   = 'Y'
      AND r.PAR_RAN_VACATION != 'Y'
      )
      LOOP
        IF l_open_blocks IS NOT NULL THEN
          l_open_blocks  := l_open_blocks ||',';
        END IF;
        l_open_blocks := l_open_blocks || '['||rec.PAR_RAN_OPEN_FROM ||','|| (rec.PAR_RAN_OPEN_TO - rec.PAR_RAN_OPEN_FROM)||','||rec.par_ran_id ||']';
      END LOOP;
    ELSIF l_elementId = 'dadb3' THEN
      FOR rec IN
      (SELECT * FROM PGIPAR_RANGES r WHERE r.PAR_RAN_VACATION = 'Y'
      )
      LOOP
        IF l_open_blocks IS NOT NULL THEN
          l_open_blocks  := l_open_blocks ||',';
        END IF;
        l_open_blocks := l_open_blocks || '['||rec.PAR_RAN_OPEN_FROM ||','|| (rec.PAR_RAN_OPEN_TO - rec.PAR_RAN_OPEN_FROM)||','||rec.par_ran_id ||']';
      END LOOP;
    END IF;
    --raise_application_error(-20001, l_open_blocks);
    l_options.put(pair_name => 'openBlocks', pair_value => '['||l_open_blocks||']');
    apex_javascript.add_onload_code(p_code => l_elementId || ' = new Dadb("' || l_elementId || '",' || l_options.to_char || ');');
    -- test data
    IF l_elementId = 'dadb1' THEN
      FOR rec IN
      (SELECT br.*,
        b.par_blo_id,
        b.par_blo_value,
        b.par_blo_color_p
      FROM PGIPAR_RANGES r,
        pgipar_blocks_ranges br,
        pgipar_blocks b
      WHERE r.par_ran_id      = br.par_blo_ran_ran_id
      AND b.par_blo_id        = br.par_blo_ran_blo_id
      AND r.PAR_RAN_DAY_MON   = 'Y'
      AND r.PAR_RAN_DAY_WED   = 'Y'
      AND r.PAR_RAN_DAY_FRI   = 'Y'
      AND r.PAR_RAN_VACATION != 'Y'
      )
      LOOP
        apex_javascript.add_onload_code(p_code => l_elementId || '.addBlocks(' || '[{ "start":'||rec.PAR_BLO_RAN_START ||',"value":'|| rec.par_blo_value||',"blockId":'||rec.par_blo_id||',"colorp":"'||rec.par_blo_color_p||'"}]'|| ');');
      END LOOP;
    ELSIF l_elementId = 'dadb2' THEN
      FOR rec IN
      (SELECT br.*,
        b.par_blo_id,
        b.par_blo_value,
        b.par_blo_color_p
      FROM PGIPAR_RANGES r,
        pgipar_blocks_ranges br,
        pgipar_blocks b
      WHERE r.par_ran_id      = br.par_blo_ran_ran_id
      AND b.par_blo_id        = br.par_blo_ran_blo_id
      AND r.PAR_RAN_DAY_TUE   = 'Y'
      AND r.PAR_RAN_DAY_THU   = 'Y'
      AND r.PAR_RAN_VACATION != 'Y'
      )
      LOOP
        apex_javascript.add_onload_code(p_code => l_elementId || '.addBlocks(' || '[{ "start":'||rec.PAR_BLO_RAN_START ||',"value":'|| rec.par_blo_value||',"blockId":'||rec.par_blo_id||',"colorp":"'||rec.par_blo_color_p||'"}]'|| ');');
      END LOOP;
    ELSIF l_elementId = 'dadb3' THEN
      FOR rec IN
      (SELECT br.*,
        b.par_blo_id,
        b.par_blo_value,
        b.par_blo_color_p
      FROM PGIPAR_RANGES r,
        pgipar_blocks_ranges br,
        pgipar_blocks b
      WHERE r.par_ran_id     = br.par_blo_ran_ran_id
      AND b.par_blo_id       = br.par_blo_ran_blo_id
      AND r.PAR_RAN_VACATION = 'Y'
      )
      LOOP
        apex_javascript.add_onload_code(p_code => l_elementId || '.addBlocks(' || '[{ "start":'||rec.PAR_BLO_RAN_START ||',"value":'|| rec.par_blo_value||',"blockId":'||rec.par_blo_id||',"colorp":"'||rec.par_blo_color_p||'"}]'|| ');');
      END LOOP;
    END IF;
    RETURN retval;
  END render;
-- test
  PROCEDURE save_data(
      p_id   VARCHAR2,
      p_data VARCHAR2)
  IS
    all_blocks json_list;
    one_block json := json();
    l_range_id NUMBER;
    l_block_id NUMBER;
    l_start    NUMBER;
    tempdata json_value;
  BEGIN
    all_blocks    := json_list(p_data);
    IF p_id = 'dadb1' THEN
      DELETE
      FROM PGIPAR_BLOCKS_RANGES
      WHERE PAR_BLO_RAN_RAN_ID IN
        (SELECT r.par_ran_id
        FROM PGIPAR_RANGES r
        WHERE r.PAR_RAN_DAY_MON = 'Y'
        AND r.PAR_RAN_DAY_WED   = 'Y'
        AND r.PAR_RAN_DAY_FRI   = 'Y'
        AND r.PAR_RAN_VACATION != 'Y'
        );
    ELSIF p_id = 'dadb2' THEN
      DELETE
      FROM PGIPAR_BLOCKS_RANGES
      WHERE PAR_BLO_RAN_RAN_ID IN
        (SELECT r.par_ran_id
        FROM PGIPAR_RANGES r
        WHERE r.PAR_RAN_DAY_TUE = 'Y'
        AND r.PAR_RAN_DAY_THU   = 'Y'
        AND r.PAR_RAN_VACATION != 'Y'
        );
    ELSIF p_id = 'dadb3' THEN
      DELETE
      FROM PGIPAR_BLOCKS_RANGES
      WHERE PAR_BLO_RAN_RAN_ID IN
        (SELECT r.par_ran_id FROM PGIPAR_RANGES r WHERE r.PAR_RAN_VACATION = 'Y');
      END IF;
      FOR i IN 1..all_blocks.count
      LOOP
        one_block  := json(all_blocks.get(i));
        l_range_id := REPLACE(one_block.get('rangeId').to_char,'"');
        l_block_id := REPLACE(one_block.get('blockId').to_char,'"');
        l_start    := REPLACE(one_block.get('start').to_char,'"');
        --
        INSERT
        INTO PGIPAR_BLOCKS_RANGES
          (
            PAR_BLO_RAN_BLO_ID,
            PAR_BLO_RAN_RAN_ID,
            PAR_BLO_RAN_START
          )
          VALUES
          (
            l_block_id,
            l_range_id,
            l_start
          );
      END LOOP;
    END;
  END drag_and_drop_blocks_plugin;
/
