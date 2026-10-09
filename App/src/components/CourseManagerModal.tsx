import React, { useRef, useState } from 'react';
import { Assignment, Course } from '../types/scheduler';
import { COURSE_PALETTES } from '../utils/learningEngine';
import { newId } from '../utils/storage';
import { DUST, INK, PAPER, RULE, TANGERINE } from '../utils/ledger';
import { Btn, Chip, FieldLabel, Label, Modal, Tag } from './ui';

interface Props {
  courses: Course[];
  assignments: Assignment[];
  onSaveCourses: (updatedCourses: Course[]) => void;
  onClose: () => void;
}

// Quick starters. Colours are assigned from the palette when one is picked.
const SUBJECT_PRESETS = [
  { code: 'MATH', name: 'Mathematics' },
  { code: 'SCIENCE', name: 'Science' },
  { code: 'ENGLISH', name: 'English & Literature' },
  { code: 'HISTORY', name: 'History & Social Studies' },
  { code: 'ART', name: 'Art, Music & Creative' },
  { code: 'CS', name: 'Computer Science' },
  { code: 'LANGUAGE', name: 'World Language' },
  { code: 'PE', name: 'PE & Health' },
];

export const CourseManagerModal: React.FC<Props> = ({ courses, assignments, onSaveCourses, onClose }) => {
  const [courseList, setCourseList] = useState<Course[]>(courses);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(courses.length === 0);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState(COURSE_PALETTES[0].hex);
  const [instructor, setInstructor] = useState('');
  const [credits, setCredits] = useState<number>(3);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const nextFreeColor = (list: Course[]) => {
    const used = new Set(list.map((c) => c.color.toLowerCase()));
    return (COURSE_PALETTES.find((p) => !used.has(p.hex.toLowerCase())) ?? COURSE_PALETTES[list.length % COURSE_PALETTES.length]).hex;
  };

  const reveal = () => setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);

  const startAdd = (preset?: { code: string; name: string }) => {
    setEditingId(null);
    setCode(preset?.code ?? '');
    setName(preset?.name ?? '');
    setColor(nextFreeColor(courseList));
    setInstructor('');
    setCredits(3);
    setIsAdding(true);
    reveal();
  };

  const startEdit = (c: Course) => {
    setIsAdding(false);
    setEditingId(c.id);
    setCode(c.code);
    setName(c.name);
    setColor(c.color);
    setInstructor(c.instructor || '');
    setCredits(c.credits || 3);
    reveal();
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const commit = (list: Course[]) => {
    setCourseList(list);
    onSaveCourses(list);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    const fields = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      color,
      instructor: instructor.trim() || undefined,
      credits: credits > 0 ? credits : 3,
    };
    if (editingId) {
      commit(courseList.map((c) => (c.id === editingId ? { ...c, ...fields } : c)));
      setEditingId(null);
    } else {
      commit([...courseList, { id: newId('course'), ...fields, createdAt: new Date().toISOString() }]);
      setIsAdding(false);
    }
  };

  const handleDelete = (id: string) => {
    commit(courseList.filter((c) => c.id !== id));
    setDeleteId(null);
    if (editingId === id) setEditingId(null);
  };

  const formOpen = isAdding || !!editingId;

  return (
    <Modal
      kicker="Your classes"
      title={
        <>
          Classes & <span className="italic">colours</span>
        </>
      }
      onClose={onClose}
      width={720}
      accent={color}
      footer={
        <>
          <span className="font-mono text-[12px]" style={{ color: DUST }}>
            Changes save as you go.
          </span>
          <Btn variant="solid" onClick={onClose}>
            Done
          </Btn>
        </>
      }
    >
      <div className="flex flex-col gap-7">
        {!formOpen && (
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <Label>Quick start</Label>
              <Btn small onClick={() => startAdd()}>
                + Custom class
              </Btn>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_PRESETS.map((p) => {
                const exists = courseList.some((c) => c.code.toUpperCase() === p.code);
                return (
                  <Chip key={p.code} disabled={exists} style={{ opacity: exists ? 0.35 : 1 }} onClick={() => startAdd(p)} title={p.name}>
                    {exists ? '✓ ' : '+ '}
                    {p.name}
                  </Chip>
                );
              })}
            </div>
          </div>
        )}

        {formOpen && (
          <form ref={formRef} onSubmit={handleSave} className="flex flex-col gap-5 p-5" style={{ border: `2px solid ${PAPER}`, background: INK }}>
            <div className="flex items-center justify-between gap-3">
              <Label wide color={PAPER}>
                {editingId ? 'Edit class' : 'New class'}
              </Label>
              <div className="flex items-center gap-3">
                <Tag color={color}>{code || 'CLASS'}</Tag>
                <span className="text-[15px] font-semibold uppercase" style={{ letterSpacing: '0.05em' }}>
                  {name || 'Class name'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <FieldLabel htmlFor="c-code">Short code *</FieldLabel>
                <input
                  id="c-code"
                  className="fld mono"
                  style={{ textTransform: 'uppercase' }}
                  required
                  value={code}
                  maxLength={12}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="MATH, ENG 9"
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="c-name">Class name *</FieldLabel>
                <input
                  id="c-name"
                  className="fld"
                  required
                  value={name}
                  maxLength={60}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Geometry, Biology, US History"
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="c-inst" hint="optional">
                  Teacher or professor
                </FieldLabel>
                <input id="c-inst" className="fld" value={instructor} maxLength={60} onChange={(e) => setInstructor(e.target.value)} />
              </div>
              <div>
                <FieldLabel htmlFor="c-credits" hint="optional">
                  Credits
                </FieldLabel>
                <input
                  id="c-credits"
                  className="fld mono"
                  type="number"
                  min={0}
                  max={12}
                  value={credits}
                  onChange={(e) => setCredits(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <FieldLabel>Colour</FieldLabel>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Class colour">
                {COURSE_PALETTES.map((p) => {
                  const active = color.toLowerCase() === p.hex.toLowerCase();
                  return (
                    <button
                      key={p.hex}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={p.name}
                      title={p.name}
                      onClick={() => setColor(p.hex)}
                      className="h-10 w-10 cursor-pointer border-none p-0"
                      style={{
                        background: p.hex,
                        outline: active ? `2px solid ${PAPER}` : '2px solid transparent',
                        outlineOffset: 3,
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <Btn variant="ghost" onClick={cancelForm}>
                Cancel
              </Btn>
              <Btn variant="solid" type="submit" disabled={!code.trim() || !name.trim()}>
                {editingId ? 'Save changes' : 'Add class'}
              </Btn>
            </div>
          </form>
        )}

        <div>
          <div className="mb-3 flex items-center justify-between">
            <Label>Your classes · {courseList.length}</Label>
            {!formOpen && courseList.length > 0 && (
              <Btn small variant="ghost" onClick={() => startAdd()}>
                + Add another
              </Btn>
            )}
          </div>
          {courseList.length === 0 && (
            <div className="p-5 font-mono text-[13px]" style={{ border: `2px dashed ${RULE}`, color: DUST }}>
              No classes yet. Fill in the form above, or pick a quick start.
            </div>
          )}
          <div className="flex flex-col">
            {courseList.map((c) => {
              const linked = assignments.filter((a) => a.courseId === c.id).length;
              return (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3"
                  style={{ borderTop: `1px solid ${RULE}` }}
                >
                  <span className="w-[92px] flex-none">
                    <Tag color={c.color}>{c.code}</Tag>
                  </span>
                  <div className="min-w-0 flex-[1_1_200px]">
                    <div className="text-[15px] font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>
                      {c.name}
                    </div>
                    <div className="font-mono text-[12px]" style={{ color: DUST }}>
                      {linked} {linked === 1 ? 'assignment' : 'assignments'}
                      {c.instructor ? ` · ${c.instructor}` : ''}
                    </div>
                  </div>
                  {deleteId === c.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[12px]" style={{ color: TANGERINE }}>
                        {linked > 0 ? 'Existing homework keeps its colour.' : 'Delete this class?'}
                      </span>
                      <Btn small variant="danger" onClick={() => handleDelete(c.id)}>
                        Delete
                      </Btn>
                      <Btn small variant="ghost" onClick={() => setDeleteId(null)}>
                        Keep
                      </Btn>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Btn small onClick={() => startEdit(c)}>
                        Edit
                      </Btn>
                      <Btn small variant="ghost" onClick={() => setDeleteId(c.id)}>
                        Delete
                      </Btn>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
