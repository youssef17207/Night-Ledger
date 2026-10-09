import React from 'react';
import {
  Code,
  Atom,
  Calculator,
  Book,
  PenTool,
  Globe,
  Microscope,
  Brain,
  Music,
  GraduationCap,
  Briefcase,
  Terminal,
} from 'lucide-react';

interface Props {
  icon?: string;
  className?: string;
}

export const COURSE_ICON_OPTIONS = [
  { id: 'code', label: 'Computer Science & Code', Icon: Code },
  { id: 'atom', label: 'Physics & Natural Sciences', Icon: Atom },
  { id: 'calculator', label: 'Mathematics & Statistics', Icon: Calculator },
  { id: 'book', label: 'Literature & Humanities', Icon: Book },
  { id: 'pen', label: 'Writing & Rhetoric', Icon: PenTool },
  { id: 'microscope', label: 'Biology & Chemistry', Icon: Microscope },
  { id: 'globe', label: 'History & Languages', Icon: Globe },
  { id: 'brain', label: 'Psychology & Neuro', Icon: Brain },
  { id: 'briefcase', label: 'Business & Economics', Icon: Briefcase },
  { id: 'terminal', label: 'Engineering & Systems', Icon: Terminal },
];

export const CourseIcon: React.FC<Props> = ({ icon, className = 'w-4 h-4' }) => {
  switch (icon) {
    case 'code':
      return <Code className={className} />;
    case 'atom':
      return <Atom className={className} />;
    case 'calculator':
      return <Calculator className={className} />;
    case 'book':
      return <Book className={className} />;
    case 'pen':
      return <PenTool className={className} />;
    case 'microscope':
      return <Microscope className={className} />;
    case 'globe':
      return <Globe className={className} />;
    case 'brain':
      return <Brain className={className} />;
    case 'briefcase':
      return <Briefcase className={className} />;
    case 'terminal':
      return <Terminal className={className} />;
    default:
      return <GraduationCap className={className} />;
  }
};
