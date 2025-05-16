import CallStackVisualizer from "@/components/CallStackVisualizer";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <CallStackVisualizer />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;