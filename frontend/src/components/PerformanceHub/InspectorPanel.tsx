/**
 * Панель инспектора для редактирования выбранного элемента.
 */
import { useState } from 'react';
import {
  Package,
  Users,
  ClipboardList,
  Palette,
  Trash2,
  Save,
  X,
} from 'lucide-react';
import { performanceHubService } from '@/services/performance_hub_service';
import type { SelectedItem } from './PerformanceConstructor';
import type {
  PerformanceInventoryLink,
  PerformanceCastMember,
  ChecklistInstance,
  InventoryLinkUpdate,
  CastMemberUpdate,
} from '@/types/performance_hub';
import type { PerformanceStructure } from '@/types/performance_hub';

interface InspectorPanelProps {
  performanceId: number;
  selectedItem: SelectedItem;
  onUpdate: () => void;
}

export function InspectorPanel({
  performanceId,
  selectedItem,
  onUpdate,
}: InspectorPanelProps) {
  if (!selectedItem) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-[#64748B] text-center">
          Выберите элемент для редактирования
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {selectedItem.type === 'section' && (
        <SectionInspector section={selectedItem.data} />
      )}
      {selectedItem.type === 'inventory' && (
        <InventoryInspector
          performanceId={performanceId}
          item={selectedItem.data}
          onUpdate={onUpdate}
        />
      )}
      {selectedItem.type === 'cast' && (
        <CastInspector
          performanceId={performanceId}
          member={selectedItem.data}
          onUpdate={onUpdate}
        />
      )}
      {selectedItem.type === 'checklist' && (
        <ChecklistInspector
          performanceId={performanceId}
          checklist={selectedItem.data}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}

// =============================================================================
// Section Inspector
// =============================================================================

interface SectionInspectorProps {
  section: PerformanceStructure['sections'][0];
}

function SectionInspector({ section }: SectionInspectorProps) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-[#D4A574]/10">
        <Palette className="w-5 h-5 text-[#D4A574]" />
        <h3 className="text-sm font-medium text-[#F1F5F9]">Раздел паспорта</h3>
      </div>

      <div className="space-y-3">
        <InfoRow label="Название" value={section.title} />
        <InfoRow label="Тип" value={section.sectionType} />
        <InfoRow label="Порядок" value={String(section.sortOrder)} />
      </div>

      <p className="text-xs text-[#64748B] mt-4">
        Редактирование разделов доступно через основной интерфейс паспорта
      </p>
    </div>
  );
}

// =============================================================================
// Inventory Inspector
// =============================================================================

interface InventoryInspectorProps {
  performanceId: number;
  item: PerformanceInventoryLink;
  onUpdate: () => void;
}

function InventoryInspector({
  performanceId,
  item,
  onUpdate,
}: InventoryInspectorProps) {
  const [editing, setEditing] = useState(false);
  const [quantity, setQuantity] = useState(item.quantity);
  const [notes, setNotes] = useState(item.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: InventoryLinkUpdate = {};
      if (quantity !== item.quantity) updateData.quantity = quantity;
      if (notes !== (item.notes || '')) updateData.notes = notes || undefined;

      await performanceHubService.updateInventoryLink(performanceId, item.id, updateData);
      onUpdate();
      setEditing(false);
    } catch (err) {
      console.error('Failed to update inventory link:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Удалить связь с инвентарём?')) return;
    try {
      await performanceHubService.removeInventoryLink(performanceId, item.id);
      onUpdate();
    } catch (err) {
      console.error('Failed to remove inventory link:', err);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#D4A574]/10">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-[#D4A574]" />
          <h3 className="text-sm font-medium text-[#F1F5F9]">Инвентарь</h3>
        </div>
        <div className="flex gap-1">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="p-1.5 text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#243044] rounded"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="p-1.5 text-[#D4A574] hover:bg-[#D4A574]/10 rounded disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-2 py-1 text-xs text-[#D4A574] hover:bg-[#D4A574]/10 rounded"
            >
              Изменить
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <InfoRow label="Название" value={item.itemName || '—'} />
        <InfoRow label="Инв. номер" value={item.itemInventoryNumber || '—'} />
        <InfoRow label="Категория" value={item.itemCategoryName || '—'} />
        <InfoRow label="Статус" value={item.itemStatus || '—'} />

        {editing ? (
          <>
            <div>
              <label className="block text-xs text-[#64748B] mb-1">Количество</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm bg-[#243044] border border-[#D4A574]/10 rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#D4A574]/30"
              />
            </div>
            <div>
              <label className="block text-xs text-[#64748B] mb-1">Примечание</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-[#243044] border border-[#D4A574]/10 rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#D4A574]/30 resize-none"
              />
            </div>
          </>
        ) : (
          <>
            <InfoRow label="Количество" value={String(item.quantity)} />
            {item.notes && <InfoRow label="Примечание" value={item.notes} />}
            {item.sceneName && <InfoRow label="Сцена" value={item.sceneName} />}
          </>
        )}
      </div>

      <button
        onClick={handleDelete}
        className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Удалить связь
      </button>
    </div>
  );
}

// =============================================================================
// Cast Inspector
// =============================================================================

interface CastInspectorProps {
  performanceId: number;
  member: PerformanceCastMember;
  onUpdate: () => void;
}

function CastInspector({
  performanceId,
  member,
  onUpdate,
}: CastInspectorProps) {
  const [editing, setEditing] = useState(false);
  const [characterName, setCharacterName] = useState(member.characterName || '');
  const [functionalRole, setFunctionalRole] = useState(member.functionalRole || '');
  const [isUnderstudy, setIsUnderstudy] = useState(member.isUnderstudy);
  const [notes, setNotes] = useState(member.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: CastMemberUpdate = {};
      if (characterName !== (member.characterName || ''))
        updateData.characterName = characterName || undefined;
      if (functionalRole !== (member.functionalRole || ''))
        updateData.functionalRole = functionalRole || undefined;
      if (isUnderstudy !== member.isUnderstudy)
        updateData.isUnderstudy = isUnderstudy;
      if (notes !== (member.notes || ''))
        updateData.notes = notes || undefined;

      await performanceHubService.updateCastMember(performanceId, member.id, updateData);
      onUpdate();
      setEditing(false);
    } catch (err) {
      console.error('Failed to update cast member:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Удалить участника из спектакля?')) return;
    try {
      await performanceHubService.removeCastMember(performanceId, member.id);
      onUpdate();
    } catch (err) {
      console.error('Failed to remove cast member:', err);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#D4A574]/10">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#D4A574]" />
          <h3 className="text-sm font-medium text-[#F1F5F9]">
            {member.roleType === 'cast' ? 'Актёр' : 'Персонал'}
          </h3>
        </div>
        <div className="flex gap-1">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="p-1.5 text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#243044] rounded"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="p-1.5 text-[#D4A574] hover:bg-[#D4A574]/10 rounded disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-2 py-1 text-xs text-[#D4A574] hover:bg-[#D4A574]/10 rounded"
            >
              Изменить
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <InfoRow label="Имя" value={member.userFullName || '—'} />
        <InfoRow label="Email" value={member.userEmail || '—'} />
        <InfoRow label="Отдел" value={member.userDepartment || '—'} />

        {editing ? (
          <>
            {member.roleType === 'cast' && (
              <>
                <div>
                  <label className="block text-xs text-[#64748B] mb-1">Персонаж</label>
                  <input
                    type="text"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    placeholder="Имя персонажа"
                    className="w-full px-3 py-2 text-sm bg-[#243044] border border-[#D4A574]/10 rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#D4A574]/30"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isUnderstudy}
                    onChange={(e) => setIsUnderstudy(e.target.checked)}
                    className="w-4 h-4 rounded border-[#D4A574]/30 bg-[#243044] text-[#D4A574] focus:ring-[#D4A574]/30"
                  />
                  <span className="text-sm text-[#F1F5F9]">Дублёр</span>
                </label>
              </>
            )}
            {member.roleType === 'crew' && (
              <div>
                <label className="block text-xs text-[#64748B] mb-1">
                  Функциональная роль
                </label>
                <input
                  type="text"
                  value={functionalRole}
                  onChange={(e) => setFunctionalRole(e.target.value)}
                  placeholder="Роль в спектакле"
                  className="w-full px-3 py-2 text-sm bg-[#243044] border border-[#D4A574]/10 rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#D4A574]/30"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-[#64748B] mb-1">Примечание</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-[#243044] border border-[#D4A574]/10 rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#D4A574]/30 resize-none"
              />
            </div>
          </>
        ) : (
          <>
            {member.roleType === 'cast' && member.characterName && (
              <InfoRow label="Персонаж" value={member.characterName} />
            )}
            {member.roleType === 'crew' && member.functionalRole && (
              <InfoRow label="Роль" value={member.functionalRole} />
            )}
            {member.isUnderstudy && (
              <div className="px-2 py-1 text-xs text-amber-400 bg-amber-500/10 rounded inline-block">
                Дублёр
              </div>
            )}
            {member.notes && <InfoRow label="Примечание" value={member.notes} />}
          </>
        )}
      </div>

      <button
        onClick={handleDelete}
        className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Удалить из спектакля
      </button>
    </div>
  );
}

// =============================================================================
// Checklist Inspector
// =============================================================================

interface ChecklistInspectorProps {
  performanceId: number;
  checklist: ChecklistInstance;
  onUpdate: () => void;
}

function ChecklistInspector({
  checklist,
  onUpdate,
}: ChecklistInspectorProps) {
  const handleToggleItem = async (index: number, currentState: boolean) => {
    try {
      await performanceHubService.updateChecklistItem(checklist.id, index, {
        isChecked: !currentState,
      });
      onUpdate();
    } catch (err) {
      console.error('Failed to update checklist item:', err);
    }
  };

  // Получаем статус элементов из completionData
  const getItemStatus = (index: number): boolean => {
    const item = checklist.completionData[String(index)];
    return item?.isChecked || false;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-[#D4A574]/10">
        <ClipboardList className="w-5 h-5 text-[#D4A574]" />
        <h3 className="text-sm font-medium text-[#F1F5F9]">Чеклист</h3>
      </div>

      <div className="space-y-3">
        <InfoRow label="Название" value={checklist.name} />
        {checklist.templateType && (
          <InfoRow label="Тип" value={checklist.templateType} />
        )}
        <InfoRow label="Статус" value={checklist.status} />

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#64748B]">Прогресс</span>
            <span className="text-[#F1F5F9]">
              {checklist.completedItems}/{checklist.totalItems}
            </span>
          </div>
          <div className="h-2 bg-[#243044] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                checklist.status === 'completed'
                  ? 'bg-emerald-400'
                  : 'bg-[#D4A574]'
              }`}
              style={{ width: `${checklist.completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="pt-3 border-t border-[#D4A574]/10">
        <p className="text-xs text-[#64748B] mb-2">Пункты чеклиста</p>
        <div className="space-y-1">
          {Array.from({ length: checklist.totalItems }, (_, i) => {
            const isChecked = getItemStatus(i);
            return (
              <button
                key={i}
                onClick={() => handleToggleItem(i, isChecked)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${
                  isChecked
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-[#243044] text-[#F1F5F9] hover:bg-[#2D3B50]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                    isChecked
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-[#64748B]'
                  }`}
                >
                  {isChecked && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-sm">Пункт {i + 1}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Shared Components
// =============================================================================

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div>
      <p className="text-xs text-[#64748B] mb-0.5">{label}</p>
      <p className="text-sm text-[#F1F5F9]">{value}</p>
    </div>
  );
}

export default InspectorPanel;
