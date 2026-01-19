import { PaginatedTable, type Column } from "../components/Table/PaginatedTable";

const Home = () => {
  type Dessert = {
    name: string;
    calories: number;
    fat: number;
    test: number;
  };

  const columns: Column<Dessert>[] = [
    { field: "name", label: "Dessert" },
    { field: "calories", label: "Calories", align: "right" },
    { field: "fat", label: "Fat (g)", align: "right" },
    { field: "test", label: "test", align: "right" },
  ];

  const rows: Dessert[] = [
    { name: "Cupcake", calories: 305, fat: 3.7,test:7 },
    { name: "Donut", calories: 452, fat: 25,test:7 },

  ];

  return (
    <PaginatedTable<Dessert>
      columns={columns}
      rows={rows}
    />
  );
};

export default Home;
