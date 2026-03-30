import { describe, it, expect, beforeEach } from 'vitest';
import { VercelAIBackend } from '../../src/backends/vercel-ai-backend';

describe('Tool Code Generation', () => {
  let backend: VercelAIBackend;

  beforeEach(() => {
    backend = new VercelAIBackend();
    process.env.MINIMAX_API_KEY = 'test-key';
  });

  describe('Query Tools', () => {
    it('should generate correct code for list_objects', () => {
      const code = backend.buildToolCode('list_objects', {});
      expect(code).toContain('llm_bridge.query_handlers');
      expect(code).toContain('handle_list_objects');
    });

    it('should generate correct code for get_object_properties', () => {
      const code = backend.buildToolCode('get_object_properties', { objectName: 'Box' });
      expect(code).toContain('llm_bridge.query_handlers');
      expect(code).toContain('handle_get_object_properties');
    });

    it('should generate correct code for get_selection', () => {
      const code = backend.buildToolCode('get_selection', {});
      expect(code).toContain('llm_bridge.query_handlers');
      expect(code).toContain('handle_selection');
    });
  });

  describe('Sketcher Tools', () => {
    it('should generate correct code for create_sketch', () => {
      const code = backend.buildToolCode('create_sketch', { name: 'Sketch001' });
      expect(code).toContain('llm_bridge.sketcher_handlers');
      expect(code).toContain('handle_create_sketch');
    });

    it('should generate correct code for add_sketch_geometry', () => {
      const code = backend.buildToolCode('add_sketch_geometry', { sketchName: 'Sketch', geometryType: 'Line' });
      expect(code).toContain('llm_bridge.sketcher_handlers');
      expect(code).toContain('handle_add_geometry');
    });
  });

  describe('PartDesign Tools', () => {
    it('should generate correct code for create_body', () => {
      const code = backend.buildToolCode('create_body', { name: 'Body001' });
      expect(code).toContain('llm_bridge.feature_handlers');
      expect(code).toContain('handle_create_body');
    });

    it('should generate correct code for create_pad', () => {
      const code = backend.buildToolCode('create_pad', { bodyName: 'Body', length: '10mm' });
      expect(code).toContain('llm_bridge.feature_handlers');
      expect(code).toContain('handle_create_pad');
    });

    it('should generate correct code for create_pocket', () => {
      const code = backend.buildToolCode('create_pocket', { bodyName: 'Body', length: '5mm' });
      expect(code).toContain('llm_bridge.feature_handlers');
      expect(code).toContain('handle_create_pocket');
    });
  });

  describe('Boolean Tools', () => {
    it('should generate correct code for boolean_fuse', () => {
      const code = backend.buildToolCode('boolean_fuse', { objectName: 'Box', toolName: 'Cylinder' });
      expect(code).toContain('llm_bridge.boolean_handlers');
      expect(code).toContain('handle_booleanFuse');
    });

    it('should generate correct code for boolean_cut', () => {
      const code = backend.buildToolCode('boolean_cut', { objectName: 'Box', toolName: 'Cylinder' });
      expect(code).toContain('llm_bridge.boolean_handlers');
      expect(code).toContain('handle_booleanCut');
    });
  });

  describe('Draft Tools', () => {
    it('should generate correct code for create_point', () => {
      const code = backend.buildToolCode('create_point', { x: 0, y: 0, z: 0 });
      expect(code).toContain('llm_bridge.draft_handlers');
      expect(code).toContain('handle_create_point');
    });

    it('should generate correct code for create_line', () => {
      const code = backend.buildToolCode('create_line', { startX: 0, startY: 0, startZ: 0, endX: 10, endY: 10, endZ: 0 });
      expect(code).toContain('llm_bridge.draft_handlers');
      expect(code).toContain('handle_create_line');
    });

    it('should generate correct code for create_circle', () => {
      const code = backend.buildToolCode('create_circle', { x: 0, y: 0, z: 0, radius: 5 });
      expect(code).toContain('llm_bridge.draft_handlers');
      expect(code).toContain('handle_create_circle');
    });
  });

  describe('Pattern Tools', () => {
    it('should generate correct code for create_linear_pattern', () => {
      const code = backend.buildToolCode('create_linear_pattern', { sourceObject: 'Pad', count: 5, spacing: 10 });
      expect(code).toContain('llm_bridge.pattern_handlers');
      expect(code).toContain('handle_create_linear_pattern');
    });

    it('should generate correct code for create_polar_pattern', () => {
      const code = backend.buildToolCode('create_polar_pattern', { sourceObject: 'Hole', count: 6 });
      expect(code).toContain('llm_bridge.pattern_handlers');
      expect(code).toContain('handle_create_polar_pattern');
    });
  });

  describe('Assembly Tools', () => {
    it('should generate correct code for create_assembly', () => {
      const code = backend.buildToolCode('create_assembly', { name: 'Assembly001' });
      expect(code).toContain('llm_bridge.assembly_handlers');
      expect(code).toContain('handle_create_assembly');
    });

    it('should generate correct code for add_component_to_assembly', () => {
      const code = backend.buildToolCode('add_component_to_assembly', { assemblyName: 'Assembly', componentName: 'Part' });
      expect(code).toContain('llm_bridge.assembly_handlers');
      expect(code).toContain('handle_add_component_to_assembly');
    });
  });

  describe('TechDraw Tools', () => {
    it('should generate correct code for create_drawing_page', () => {
      const code = backend.buildToolCode('create_drawing_page', { name: 'Page001' });
      expect(code).toContain('llm_bridge.techdraw_handlers');
      expect(code).toContain('handle_create_drawing_page');
    });

    it('should generate correct code for create_standard_view', () => {
      const code = backend.buildToolCode('create_standard_view', { viewName: 'View001' });
      expect(code).toContain('llm_bridge.techdraw_handlers');
      expect(code).toContain('handle_create_standard_view');
    });
  });

  describe('Surface Tools', () => {
    it('should generate correct code for create_loft', () => {
      const code = backend.buildToolCode('create_loft', { profiles: ['Sketch1', 'Sketch2'] });
      expect(code).toContain('llm_bridge.surface_handlers');
      expect(code).toContain('handle_create_loft');
    });

    it('should generate correct code for create_sweep', () => {
      const code = backend.buildToolCode('create_sweep', { profile: 'Sketch1', path: 'Sketch2' });
      expect(code).toContain('llm_bridge.surface_handlers');
      expect(code).toContain('handle_create_sweep');
    });
  });

  describe('Kinematic Tools', () => {
    it('should generate correct code for initialize_kinematic_solver', () => {
      const code = backend.buildToolCode('initialize_kinematic_solver', { assemblyName: 'Assembly' });
      expect(code).toContain('llm_bridge.kinematic_handlers');
      expect(code).toContain('handle_initialize_kinematic_solver');
    });

    it('should generate correct code for solve_assembly', () => {
      const code = backend.buildToolCode('solve_assembly', { assemblyName: 'Assembly' });
      expect(code).toContain('llm_bridge.kinematic_handlers');
      expect(code).toContain('handle_solve_assembly');
    });
  });

  describe('View Tools', () => {
    it('should generate correct code for set_view_angle', () => {
      const code = backend.buildToolCode('set_view_angle', { angleX: 45, angleY: 30 });
      expect(code).toContain('llm_bridge.view_handlers');
      expect(code).toContain('handle_set_view_angle');
    });

    it('should generate correct code for zoom_to_fit', () => {
      const code = backend.buildToolCode('zoom_to_fit', {});
      expect(code).toContain('llm_bridge.view_handlers');
      expect(code).toContain('handle_zoom_to_fit');
    });
  });

  describe('Mesh Tools', () => {
    it('should generate correct code for shape_to_mesh', () => {
      const code = backend.buildToolCode('shape_to_mesh', { objectName: 'Box' });
      expect(code).toContain('llm_bridge.mesh_handlers');
      expect(code).toContain('handle_shape_to_mesh');
    });

    it('should generate correct code for mesh_to_shape', () => {
      const code = backend.buildToolCode('mesh_to_shape', { objectName: 'Mesh' });
      expect(code).toContain('llm_bridge.mesh_handlers');
      expect(code).toContain('handle_mesh_to_shape');
    });
  });

  describe('FEA Tools', () => {
    it('should generate correct code for create_fea_analysis', () => {
      const code = backend.buildToolCode('create_fea_analysis', { name: 'Analysis001' });
      expect(code).toContain('llm_bridge.fea_handlers');
      expect(code).toContain('handle_create_fea_analysis');
    });

    it('should generate correct code for run_fea_analysis', () => {
      const code = backend.buildToolCode('run_fea_analysis', { analysisName: 'Analysis001' });
      expect(code).toContain('llm_bridge.fea_handlers');
      expect(code).toContain('handle_run_fea_analysis');
    });
  });

  describe('Path Tools', () => {
    it('should generate correct code for create_path_job', () => {
      const code = backend.buildToolCode('create_path_job', { name: 'Job001' });
      expect(code).toContain('llm_bridge.path_handlers');
      expect(code).toContain('handle_create_path_job');
    });

    it('should generate correct code for export_gcode', () => {
      const code = backend.buildToolCode('export_gcode', { jobName: 'Job001', filePath: '/path/to/gcode.nc' });
      expect(code).toContain('llm_bridge.path_handlers');
      expect(code).toContain('handle_export_gcode');
    });
  });

  describe('Spreadsheet Tools', () => {
    it('should generate correct code for create_spreadsheet', () => {
      const code = backend.buildToolCode('create_spreadsheet', { name: 'Spreadsheet001' });
      expect(code).toContain('llm_bridge.spreadsheet_handlers');
      expect(code).toContain('handle_create_spreadsheet');
    });

    it('should generate correct code for set_cell', () => {
      const code = backend.buildToolCode('set_cell', { spreadsheetName: 'Spreadsheet', cell: 'A1', value: '10' });
      expect(code).toContain('llm_bridge.spreadsheet_handlers');
      expect(code).toContain('handle_set_cell');
    });
  });

  describe('BIM Tools', () => {
    it('should generate correct code for create_wall', () => {
      const code = backend.buildToolCode('create_wall', { height: 3000, width: 100 });
      expect(code).toContain('llm_bridge.bim_handlers');
      expect(code).toContain('handle_create_wall');
    });

    it('should generate correct code for create_column', () => {
      const code = backend.buildToolCode('create_column', { height: 3000, width: 200 });
      expect(code).toContain('llm_bridge.bim_handlers');
      expect(code).toContain('handle_create_column');
    });
  });

  describe('Measurement Tools', () => {
    it('should generate correct code for measure_distance', () => {
      const code = backend.buildToolCode('measure_distance', { point1X: 0, point1Y: 0, point1Z: 0, point2X: 100, point2Y: 0, point2Z: 0 });
      expect(code).toContain('llm_bridge.measurement_handlers');
      expect(code).toContain('handle_measure_distance');
    });

    it('should generate correct code for measure_angle', () => {
      const code = backend.buildToolCode('measure_angle', { point1X: 0, point1Y: 0, point1Z: 0, point2X: 100, point2Y: 0, point2Z: 0, point3X: 100, point3Y: 100, point3Z: 0 });
      expect(code).toContain('llm_bridge.measurement_handlers');
      expect(code).toContain('handle_measure_angle');
    });
  });

  describe('Error Handling', () => {
    it('should generate error code for unknown tools', () => {
      const code = backend.buildToolCode('unknown_tool', { param: 'value' });
      expect(code).toContain('not yet supported');
    });
  });
});
