create or replace package drag_and_drop_blocks_plugin is


  function render(p_region              in apex_plugin.t_region,
                  p_plugin              in apex_plugin.t_plugin,
                  p_is_printer_friendly in boolean)
    return apex_plugin.t_region_render_result;

  -- test
  procedure save_data(p_id varchar2, p_data varchar2);

end drag_and_drop_blocks_plugin;

/
