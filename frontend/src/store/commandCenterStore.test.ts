/**
 * Tests for Command Center Store
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCommandCenterStore } from './commandCenterStore';

describe('commandCenterStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useCommandCenterStore.setState({
      isOpen: false,
      searchQuery: '',
    });
  });

  describe('initial state', () => {
    it('should have isOpen as false initially', () => {
      const { isOpen } = useCommandCenterStore.getState();
      expect(isOpen).toBe(false);
    });

    it('should have empty searchQuery initially', () => {
      const { searchQuery } = useCommandCenterStore.getState();
      expect(searchQuery).toBe('');
    });
  });

  describe('open action', () => {
    it('should set isOpen to true', () => {
      useCommandCenterStore.getState().open();
      expect(useCommandCenterStore.getState().isOpen).toBe(true);
    });

    it('should reset searchQuery when opening', () => {
      useCommandCenterStore.setState({ searchQuery: 'test' });
      useCommandCenterStore.getState().open();
      expect(useCommandCenterStore.getState().searchQuery).toBe('');
    });
  });

  describe('close action', () => {
    it('should set isOpen to false', () => {
      useCommandCenterStore.setState({ isOpen: true });
      useCommandCenterStore.getState().close();
      expect(useCommandCenterStore.getState().isOpen).toBe(false);
    });

    it('should reset searchQuery when closing', () => {
      useCommandCenterStore.setState({ isOpen: true, searchQuery: 'test' });
      useCommandCenterStore.getState().close();
      expect(useCommandCenterStore.getState().searchQuery).toBe('');
    });
  });

  describe('toggle action', () => {
    it('should toggle isOpen from false to true', () => {
      useCommandCenterStore.getState().toggle();
      expect(useCommandCenterStore.getState().isOpen).toBe(true);
    });

    it('should toggle isOpen from true to false', () => {
      useCommandCenterStore.setState({ isOpen: true });
      useCommandCenterStore.getState().toggle();
      expect(useCommandCenterStore.getState().isOpen).toBe(false);
    });

    it('should reset searchQuery when toggling', () => {
      useCommandCenterStore.setState({ searchQuery: 'test' });
      useCommandCenterStore.getState().toggle();
      expect(useCommandCenterStore.getState().searchQuery).toBe('');
    });
  });

  describe('setSearchQuery action', () => {
    it('should update searchQuery', () => {
      useCommandCenterStore.getState().setSearchQuery('inventory');
      expect(useCommandCenterStore.getState().searchQuery).toBe('inventory');
    });

    it('should allow empty string', () => {
      useCommandCenterStore.setState({ searchQuery: 'test' });
      useCommandCenterStore.getState().setSearchQuery('');
      expect(useCommandCenterStore.getState().searchQuery).toBe('');
    });
  });

  describe('reset action', () => {
    it('should reset all state', () => {
      useCommandCenterStore.setState({ isOpen: true, searchQuery: 'test' });
      useCommandCenterStore.getState().reset();

      const state = useCommandCenterStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.searchQuery).toBe('');
    });
  });
});
